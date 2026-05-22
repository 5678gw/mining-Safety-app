const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { sendEmail } = require('../config/email');

const router = express.Router();

router.get('/learners', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const query = `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.student_number, u.created_at FROM users u WHERE u.role = 'student' ORDER BY u.created_at DESC`;
    const result = await pool.query(query);
    res.json({ message: 'Learners retrieved', learners: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learners' });
  }
});

router.get('/exam-results', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const query = `SELECT ea.*, u.first_name, u.last_name, u.student_number, u.email FROM exam_attempts ea JOIN users u ON ea.user_id = u.id ORDER BY ea.submitted_at DESC`;
    const result = await pool.query(query);
    res.json({ message: 'Exam results retrieved', results: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.put('/payment/:learnerId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { learnerId } = req.params;
    const { status, amount } = req.body;
    const query = `INSERT INTO payments (user_id, status, amount, payment_date) VALUES ($1, $2, $3, CURRENT_DATE) ON CONFLICT (user_id) DO UPDATE SET status = $2, updated_at = CURRENT_TIMESTAMP RETURNING *`;
    const result = await pool.query(query, [learnerId, status, amount]);
    res.json({ message: 'Payment updated', payment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

router.post('/certificate/issue', verifyToken, verifyAdmin, async (req, res) => {
  try {\n    const { learnerId, examAttemptId, referenceNumber } = req.body;
    const examQuery = `SELECT ea.*, u.email, u.first_name, u.student_number FROM exam_attempts ea JOIN users u ON ea.user_id = u.id WHERE ea.id = $1 AND ea.passed = true`;
    const examResult = await pool.query(examQuery, [examAttemptId]);
    if (examResult.rows.length === 0) {
      return res.status(400).json({ error: 'Exam not passed' });
    }
    const exam = examResult.rows[0];
    const certId = uuidv4();
    const certRefNum = referenceNumber || `MSA-REF-${Date.now()}`;
    const certQuery = `INSERT INTO certificates (id, user_id, reference_number, exam_attempt_id, exam_score, issue_date, status) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 'issued') RETURNING *`;
    const certResult = await pool.query(certQuery, [certId, learnerId, certRefNum, examAttemptId, exam.obtained_marks]);
    await sendEmail(exam.email, 'certificateReady', exam.first_name, exam.student_number, certRefNum);
    res.json({ message: 'Certificate issued', certificate: certResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

router.get('/analytics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const learners = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']);
    const exams = await pool.query('SELECT COUNT(*) FROM exam_attempts WHERE passed = true');
    const certs = await pool.query('SELECT COUNT(*) FROM certificates WHERE status = $1', ['issued']);
    res.json({ message: 'Analytics', analytics: { totalLearners: parseInt(learners.rows[0].count), passedExams: parseInt(exams.rows[0].count), issuedCerts: parseInt(certs.rows[0].count) } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;

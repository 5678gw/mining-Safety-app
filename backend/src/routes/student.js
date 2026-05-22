const express = require('express');
const pool = require('../config/database');
const { verifyToken, verifyStudent } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', verifyToken, verifyStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    const userQuery = `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.student_number, u.created_at FROM users u WHERE u.id = $1`;
    const result = await pool.query(userQuery, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ message: 'Profile retrieved', profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.get('/lessons', verifyToken, verifyStudent, async (req, res) => {
  try {
    const lessonsQuery = `SELECT id, module_number, module_name, content, key_message, case_study FROM lessons ORDER BY module_number ASC`;
    const result = await pool.query(lessonsQuery);
    res.json({ message: 'Lessons retrieved', lessons: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

router.post('/lessons/:lessonId/complete', verifyToken, verifyStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    const query = `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at) VALUES ($1, $2, true, CURRENT_TIMESTAMP) ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = CURRENT_TIMESTAMP RETURNING id, completed`;
    const result = await pool.query(query, [userId, lessonId]);
    res.json({ message: 'Lesson marked complete', progress: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark lesson' });
  }
});

router.get('/lesson-progress', verifyToken, verifyStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `SELECT COUNT(*) as completed FROM lesson_progress WHERE user_id = $1 AND completed = true`;
    const result = await pool.query(query, [userId]);
    const completed = parseInt(result.rows[0].completed);
    res.json({ message: 'Progress retrieved', progress: { completed, total: 5, percentage: (completed / 5) * 100 } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

router.get('/exam-results', verifyToken, verifyStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `SELECT id, attempt_number, submitted_at, obtained_marks, total_marks, percentage, passed FROM exam_attempts WHERE user_id = $1 ORDER BY submitted_at DESC`;
    const result = await pool.query(query, [userId]);
    res.json({ message: 'Results retrieved', results: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.get('/certificate', verifyToken, verifyStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `SELECT reference_number, issue_date, status FROM certificates WHERE user_id = $1 LIMIT 1`;
    const result = await pool.query(query, [userId]);
    res.json({ message: 'Certificate retrieved', certificate: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

router.get('/payment-status', verifyToken, verifyStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `SELECT status, amount, payment_date FROM payments WHERE user_id = $1 LIMIT 1`;
    const result = await pool.query(query, [userId]);
    res.json({ message: 'Payment retrieved', payment: result.rows[0] || { status: 'pending' } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

module.exports = router;

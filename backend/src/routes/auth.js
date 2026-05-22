const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { sendEmail } = require('../config/email');

const router = express.Router();

const generateStudentNumber = () => {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `MSA-${year}-${randomPart}`;
};

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, idNumber, province, city, town, suburb, postalCode } = req.body;

    if (!firstName || !lastName || !email || !password || !idNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const idCheck = await pool.query('SELECT id FROM users WHERE id_number = $1', [idNumber]);
    if (idCheck.rows.length > 0) {
      return res.status(400).json({ error: 'ID already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const studentNumber = generateStudentNumber();
    const userId = uuidv4();

    const userQuery = `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, id_number, student_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, first_name, last_name, student_number`;
    const userResult = await pool.query(userQuery, [userId, email, passwordHash, 'student', firstName, lastName, phone, idNumber, studentNumber]);

    if (province && city && town && suburb && postalCode) {
      await pool.query(`INSERT INTO student_locations (user_id, province, city, town, suburb, postal_code) VALUES ($1, $2, $3, $4, $5, $6)`, [userId, province, city, town, suburb, postalCode]);
    }

    await sendEmail(email, 'registrationConfirmation', firstName, studentNumber);
    const token = generateToken(userResult.rows[0]);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        firstName: userResult.rows[0].first_name,
        lastName: userResult.rows[0].last_name,
        studentNumber: userResult.rows[0].student_number,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userQuery = `SELECT id, email, password_hash, role, first_name, last_name, student_number FROM users WHERE email = $1 AND is_active = true`;
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        studentNumber: user.student_number,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userQuery = `SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = $1 AND role = 'admin' AND is_active = true`;
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Admin credentials invalid' });
    }

    const user = userResult.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Admin credentials invalid' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

router.get('/verify', async (req, res) => {
  res.json({ message: 'Auth endpoint active' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const logger = require('../config/logger');

// Register Client
router.post('/register', async (req, res) => {
  try {
    const { email, password, company_name } = req.body;

    const existing = await Client.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const client = await Client.create({
      email,
      password_hash,
      company_name
    });

    res.status(201).json({ message: 'Client registered successfully', client_id: client._id });
  } catch (err) {
    logger.error('Registration Error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login Client
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const client = await Client.findOne({ email });
    if (!client) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, client.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ client_id: client._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, client: { email: client.email, company_name: client.company_name } });
  } catch (err) {
    logger.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;

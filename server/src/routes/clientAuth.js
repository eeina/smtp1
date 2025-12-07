const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const logger = require('../config/logger');

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
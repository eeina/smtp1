const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const Mailbox = require('../models/Mailbox');
const logger = require('../config/logger');

// Unified Login Route
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Try to find as Client (Admin)
    const client = await Client.findOne({ email });
    if (client) {
      const isMatch = await bcrypt.compare(password, client.password_hash);
      if (isMatch) {
        const token = jwt.sign({ client_id: client._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        return res.json({
          token,
          role: 'client',
          email: client.email,
          company_name: client.company_name
        });
      }
    }

    // 2. Try to find as Mailbox (Webmail User)
    const mailbox = await Mailbox.findOne({ email });
    if (mailbox) {
      const isMatch = await bcrypt.compare(password, mailbox.password_hash);
      if (isMatch) {
        const token = jwt.sign({ mailbox_id: mailbox._id, email: mailbox.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        return res.json({
          token,
          role: 'mailbox',
          email: mailbox.email
        });
      }
    }

    // 3. Neither found
    return res.status(400).json({ error: 'Invalid email or password' });

  } catch (err) {
    logger.error('Unified Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
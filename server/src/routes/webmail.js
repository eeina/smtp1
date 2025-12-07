const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
const { authenticateWebmail } = require('../middleware/auth');
const logger = require('../config/logger');
const emailService = require('../services/email.service');

// Webmail Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const mailbox = await Mailbox.findOne({ email });
    if (!mailbox) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, mailbox.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ mailbox_id: mailbox._id, email: mailbox.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, email: mailbox.email });
  } catch (err) {
    logger.error('Webmail Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Webmail Profile
router.get('/profile', authenticateWebmail, async (req, res) => {
    try {
        const mailbox = await Mailbox.findById(req.user.mailbox_id);
        if(!mailbox) return res.status(404).json({error: "Mailbox not found"});
        res.json({
            email: mailbox.email,
            recovery_email: mailbox.recovery_email
        });
    } catch(err) {
        res.status(500).json({error: "Server Error"});
    }
});

// Webmail Messages
router.get('/messages', authenticateWebmail, async (req, res) => {
  try {
    const messages = await EmailMessage.find({ mailbox_id: req.user.mailbox_id })
      .sort({ created_at: -1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Delete Message
router.delete('/messages/:id', authenticateWebmail, async (req, res) => {
  try {
    const msg = await EmailMessage.findOneAndDelete({
      _id: req.params.id,
      mailbox_id: req.user.mailbox_id
    });
    
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    logger.error('Delete Message Error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Send Email
router.post('/send', authenticateWebmail, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    if (!to) return res.status(400).json({ error: 'Recipient required' });

    const senderMailboxId = req.user.mailbox_id;
    const senderEmail = req.user.email;

    // 1. Save to Sender's Sent Folder
    const htmlContent = body ? body.replace(/\n/g, '<br>') : '';
    const safeHtml = `<div style="font-family: sans-serif;">${htmlContent}</div>`;
    
    await EmailMessage.create({
      mailbox_id: senderMailboxId,
      direction: 'outbound',
      from: senderEmail,
      to,
      subject: subject || '',
      text_body: body || '',
      html_body: safeHtml,
      folder: 'sent',
      is_read: true
    });

    // 2. Process Delivery
    const recipients = to.split(/[;,]+/).map(r => r.trim()).filter(r => r);

    for (const recipientEmail of recipients) {
      emailService.sendEmail(senderEmail, recipientEmail, subject, body, safeHtml);
    }

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    logger.error('Send Error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
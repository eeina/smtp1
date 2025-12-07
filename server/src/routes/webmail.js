const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
const { authenticateWebmail } = require('../middleware/auth');
const logger = require('../config/logger');

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

// Send Email
router.post('/send', authenticateWebmail, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    if (!to) return res.status(400).json({ error: 'Recipient required' });

    const senderMailboxId = req.user.mailbox_id;
    const senderEmail = req.user.email;

    // 1. Save to Sender's Sent Folder
    // We convert newlines to <br> for basic HTML display compatibility
    const htmlContent = body ? body.replace(/\n/g, '<br>') : '';
    
    await EmailMessage.create({
      mailbox_id: senderMailboxId,
      direction: 'outbound',
      from: senderEmail,
      to,
      subject: subject || '',
      text_body: body || '',
      html_body: `<div style="font-family: sans-serif;">${htmlContent}</div>`,
      folder: 'sent',
      is_read: true
    });

    // 2. Local Delivery Logic
    // Check if recipients are local users and deliver to their Inbox
    const recipients = to.split(/[;,]+/).map(r => r.trim()).filter(r => r);

    for (const recipientEmail of recipients) {
      const recipientMailbox = await Mailbox.findOne({ email: recipientEmail });
      
      if (recipientMailbox) {
        await EmailMessage.create({
          mailbox_id: recipientMailbox._id,
          direction: 'inbound',
          from: senderEmail,
          to: recipientEmail,
          subject: subject || '',
          text_body: body || '',
          html_body: `<div style="font-family: sans-serif;">${htmlContent}</div>`,
          folder: 'inbox',
          is_read: false
        });
        logger.info(`Internal Delivery: ${senderEmail} -> ${recipientEmail}`);
      } else {
        // Logic for external relay (e.g., via Relay Host or DNS/MX resolution) would go here.
        // For now, we only log it.
        logger.info(`External Delivery Queued (Not Implemented): ${recipientEmail}`);
      }
    }

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    logger.error('Send Error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;

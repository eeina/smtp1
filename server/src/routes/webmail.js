const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dns = require('dns').promises;
const nodemailer = require('nodemailer');
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

// Helper: Send email to external server
const deliverExternal = async (senderEmail, recipientEmail, subject, text, html) => {
  try {
    const domainPart = recipientEmail.split('@')[1];
    if (!domainPart) throw new Error('Invalid recipient domain');

    // 1. Resolve MX Records
    const mxRecords = await dns.resolveMx(domainPart);
    if (!mxRecords || mxRecords.length === 0) throw new Error('No MX records found for domain');

    // Sort by priority (lowest number first)
    const bestMx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;
    
    logger.info(`Resolving delivery for ${recipientEmail}: via ${bestMx}`);

    // 2. Prepare DKIM Signing
    // Fetch sender mailbox and domain to get private key
    const senderMailbox = await Mailbox.findOne({ email: senderEmail }).populate('domain_id');
    let dkimOptions = undefined;

    if (senderMailbox && senderMailbox.domain_id && senderMailbox.domain_id.dkim_private_key) {
      dkimOptions = {
        domainName: senderMailbox.domain_id.name,
        keySelector: 'default', // We default to 'default' selector
        privateKey: senderMailbox.domain_id.dkim_private_key
      };
      logger.info(`DKIM Signing enabled for ${senderEmail}`);
    } else {
      logger.warn(`No DKIM key found for ${senderEmail}. Email will be unsigned.`);
    }

    // 3. Create Transporter
    const transporter = nodemailer.createTransport({
      host: bestMx,
      port: 25, // Standard MTA-to-MTA port
      secure: false, // TLS is upgraded via STARTTLS usually
      tls: {
        rejectUnauthorized: false // Often necessary for opportunistic TLS
      },
      name: process.env.MY_HOSTNAME || 'smtp-server.local', // HELO hostname
      dkim: dkimOptions
    });

    // 4. Send
    await transporter.sendMail({
      from: senderEmail,
      to: recipientEmail,
      subject: subject,
      text: text,
      html: html
    });
    
    logger.info(`External Delivery Success: ${recipientEmail}`);
    return true;
  } catch (error) {
    logger.error(`External Delivery Failed to ${recipientEmail}: ${error.message}`);
    return false;
  }
};

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
      // Check if local
      const recipientMailbox = await Mailbox.findOne({ email: recipientEmail });
      
      if (recipientMailbox) {
        // --- LOCAL DELIVERY ---
        await EmailMessage.create({
          mailbox_id: recipientMailbox._id,
          direction: 'inbound',
          from: senderEmail,
          to: recipientEmail,
          subject: subject || '',
          text_body: body || '',
          html_body: safeHtml,
          folder: 'inbox',
          is_read: false
        });
        logger.info(`Internal Delivery: ${senderEmail} -> ${recipientEmail}`);
      } else {
        // --- EXTERNAL DELIVERY ---
        // Fire and forget (don't block the API response, but log errors)
        deliverExternal(senderEmail, recipientEmail, subject, body, safeHtml);
      }
    }

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    logger.error('Send Error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;

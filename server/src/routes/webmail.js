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
    
    res.json({ 
        token, 
        email: mailbox.email,
        first_name: mailbox.first_name,
        last_name: mailbox.last_name
    });
  } catch (err) {
    logger.error('Webmail Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Change Password
router.put('/password', authenticateWebmail, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const mailbox = await Mailbox.findById(req.user.mailbox_id);
    if (!mailbox) return res.status(404).json({ error: 'Mailbox not found' });

    const isMatch = await bcrypt.compare(currentPassword, mailbox.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    const salt = await bcrypt.genSalt(10);
    mailbox.password_hash = await bcrypt.hash(newPassword, salt);
    await mailbox.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    logger.error('Webmail Password Update Error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Get Webmail Profile
router.get('/profile', authenticateWebmail, async (req, res) => {
    try {
        const mailbox = await Mailbox.findById(req.user.mailbox_id);
        if(!mailbox) return res.status(404).json({error: "Mailbox not found"});
        res.json({
            email: mailbox.email,
            first_name: mailbox.first_name,
            last_name: mailbox.last_name,
            recovery_email: mailbox.recovery_email
        });
    } catch(err) {
        res.status(500).json({error: "Server Error"});
    }
});

// Webmail Messages (Paginated)
router.get('/messages', authenticateWebmail, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const folder = req.query.folder || 'inbox';
    const skip = (page - 1) * limit;

    const query = { 
        mailbox_id: req.user.mailbox_id,
        folder: folder
    };

    const [messages, total] = await Promise.all([
        EmailMessage.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit),
        EmailMessage.countDocuments(query)
    ]);

    res.json({
        messages,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
        }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark Message as Read
router.patch('/messages/:id/read', authenticateWebmail, async (req, res) => {
    try {
        const msg = await EmailMessage.findOneAndUpdate(
            { _id: req.params.id, mailbox_id: req.user.mailbox_id },
            { is_read: true },
            { new: true }
        );
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        res.json(msg);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// Batch Delete Messages
router.post('/messages/batch-delete', authenticateWebmail, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid IDs provided' });

        await EmailMessage.deleteMany({
            _id: { $in: ids },
            mailbox_id: req.user.mailbox_id
        });

        res.json({ message: 'Messages deleted' });
    } catch (err) {
        logger.error('Batch Delete Error:', err);
        res.status(500).json({ error: 'Failed to delete messages' });
    }
});

// Delete Single Message
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
    const { to, cc, bcc, subject, htmlBody, attachments } = req.body;
    
    if (!to) return res.status(400).json({ error: 'Recipient required' });

    const senderMailboxId = req.user.mailbox_id;
    const senderEmail = req.user.email;

    // Fetch full mailbox details to get Name
    const sender = await Mailbox.findById(senderMailboxId);
    
    // Construct Friendly Name Header: "John Doe" <john@example.com>
    let fromHeader = senderEmail;
    if (sender && (sender.first_name || sender.last_name)) {
        const fullName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim();
        fromHeader = `"${fullName}" <${senderEmail}>`;
    }

    // 1. Prepare Content
    const safeHtml = `<div style="font-family: sans-serif;">${htmlBody}</div>`;
    // Create plain text fallback (simple strip tags)
    const plainText = htmlBody.replace(/<[^>]+>/g, ' ');

    // 2. Prepare Attachments for Nodemailer
    // Frontend sends: { filename, content: "base64string...", contentType }
    const processedAttachments = attachments ? attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content.split('base64,')[1], 'base64'),
        contentType: att.contentType
    })) : [];

    // 3. Save to Sender's Sent Folder
    // Note: We are NOT storing attachments in Mongo for now to save space, but we mark it.
    await EmailMessage.create({
      mailbox_id: senderMailboxId,
      direction: 'outbound',
      from: fromHeader,
      to,
      cc: cc || '',
      bcc: bcc || '',
      subject: subject || '',
      text_body: plainText,
      html_body: safeHtml,
      has_attachments: processedAttachments.length > 0,
      folder: 'sent',
      is_read: true
    });

    // 4. Process Delivery
    const recipients = to.split(/[;,]+/).map(r => r.trim()).filter(r => r);
    const ccRecipients = cc ? cc.split(/[;,]+/).map(r => r.trim()).filter(r => r) : [];
    const bccRecipients = bcc ? bcc.split(/[;,]+/).map(r => r.trim()).filter(r => r) : [];
    
    // Combine all unique recipients to iterate over for delivery
    // Note: We iterate because our `sendEmail` service handles internal vs external routing *per recipient*.
    const allRecipients = new Set([...recipients, ...ccRecipients, ...bccRecipients]);

    for (const recipientEmail of allRecipients) {
      await emailService.sendEmail(fromHeader, recipientEmail, subject, plainText, safeHtml, {
        cc,
        bcc,
        attachments: processedAttachments
      });
    }

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    logger.error('Send Error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
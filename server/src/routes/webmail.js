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

    // Also collect CC and BCC for external delivery logic if needed, 
    // but simplified loop here sends individually to ensure better deliverability/tracking per RCPT TO in basic SMTP logic.
    // However, for correct header display, we pass the cc/bcc strings to the service options.
    
    // NOTE: In a true SMTP relay, we send one envelope to all recipients. 
    // Here we iterate 'to' for individual processing logic in our service, 
    // but we pass cc/bcc to `emailService` which handles `nodemailer` parameters.
    
    // Sending to "TO" recipients
    for (const recipientEmail of recipients) {
      await emailService.sendEmail(fromHeader, recipientEmail, subject, plainText, safeHtml, {
        cc,
        bcc,
        attachments: processedAttachments
      });
    }

    // We also need to ensure CC and BCC recipients actually get the email if they aren't in the "TO" loop.
    // A more robust implementation would unify all recipients into one delivery list.
    // For this lightweight implementation, let's rely on the first loop if there is a 'to', 
    // or specifically address cc/bcc if they are external.
    
    // If we want to be strictly correct with Nodemailer, we can call it ONCE with all recipients.
    // However, our `sendEmail` service handles "Internal vs External" switching per recipient.
    // So we should iterate ALL recipients.
    
    const allRecipients = new Set([
        ...recipients,
        ...(cc ? cc.split(/[;,]+/).map(r => r.trim()).filter(r => r) : []),
        ...(bcc ? bcc.split(/[;,]+/).map(r => r.trim()).filter(r => r) : [])
    ]);

    // We only need to trigger the service for unique addresses NOT in the main 'to' loop we just did?
    // Actually, `emailService.sendEmail` logic sends to *one specific recipient* (the 2nd arg).
    // The `cc` and `bcc` options in 6th arg are just for HEADERS in that email.
    // So we MUST iterate everyone.
    
    // To avoid sending duplicates to "To" list (processed above), let's refactor slightly:
    // We already sent to 'to' list. Now send to others.
    
    const ccRecipients = cc ? cc.split(/[;,]+/).map(r => r.trim()).filter(r => r) : [];
    const bccRecipients = bcc ? bcc.split(/[;,]+/).map(r => r.trim()).filter(r => r) : [];
    
    const secondaryRecipients = [...ccRecipients, ...bccRecipients];
    
    for (const recipientEmail of secondaryRecipients) {
        await emailService.sendEmail(fromHeader, recipientEmail, subject, plainText, safeHtml, {
            cc, // Include headers so they see who else is copied
            // bcc headers are usually stripped by transport, but we pass them just in case
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
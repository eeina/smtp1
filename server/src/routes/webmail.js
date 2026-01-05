const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
const { authenticateWebmail } = require('../middleware/auth');
const logger = require('../config/logger');
const emailService = require('../services/email.service');

// Initialize GridFS Bucket
let bucket;
mongoose.connection.on('connected', () => {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'attachments'
    });
});

const base64ToBuffer = (base64String) => {
    if (!base64String) return Buffer.alloc(0);
    const parts = base64String.split('base64,');
    const raw = parts.length > 1 ? parts[1] : parts[0];
    return Buffer.from(raw, 'base64');
};

// Webmail Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const mailbox = await Mailbox.findOne({ email: email.toLowerCase() });
    if (!mailbox) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, mailbox.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ mailbox_id: mailbox._id, email: mailbox.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, email: mailbox.email, first_name: mailbox.first_name, last_name: mailbox.last_name });
  } catch (err) {
    logger.error('Webmail Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Change Password
router.put('/password', authenticateWebmail, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
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
        res.json({ email: mailbox.email, first_name: mailbox.first_name, last_name: mailbox.last_name, recovery_email: mailbox.recovery_email });
    } catch(err) { res.status(500).json({error: "Server Error"}); }
});

// Get Messages
router.get('/messages', authenticateWebmail, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const folder = req.query.folder || 'inbox';
    const skip = (page - 1) * limit;
    const query = { mailbox_id: req.user.mailbox_id, folder: folder };
    const [messages, total] = await Promise.all([
        EmailMessage.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
        EmailMessage.countDocuments(query)
    ]);
    res.json({ messages, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch messages' }); }
});

// Download Attachment from GridFS
router.get('/messages/:id/download/:filename', authenticateWebmail, async (req, res) => {
  try {
    const message = await EmailMessage.findOne({ _id: req.params.id, mailbox_id: req.user.mailbox_id });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    const att = message.attachments.find(a => a.filename === req.params.filename);
    if (!att || !att.gridfs_id) return res.status(404).json({ error: 'Attachment not found' });

    res.setHeader('Content-Type', att.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${att.filename}"`);
    
    const downloadStream = bucket.openDownloadStream(att.gridfs_id);
    downloadStream.on('error', (err) => {
        logger.error('GridFS Stream Error:', err);
        res.status(500).end();
    });
    downloadStream.pipe(res);
  } catch (err) {
    logger.error('Download Error:', err);
    res.status(500).json({ error: 'Failed to download attachment' });
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
        res.json(msg);
    } catch (err) { res.status(500).json({ error: 'Failed to update message' }); }
});

// Batch Delete Messages
router.post('/messages/batch-delete', authenticateWebmail, async (req, res) => {
    try {
        const { ids } = req.body;
        const messages = await EmailMessage.find({ _id: { $in: ids }, mailbox_id: req.user.mailbox_id });
        for (const msg of messages) {
            for (const att of msg.attachments) {
                if (att.gridfs_id) await bucket.delete(att.gridfs_id).catch(() => {});
            }
        }
        await EmailMessage.deleteMany({ _id: { $in: ids }, mailbox_id: req.user.mailbox_id });
        res.json({ message: 'Messages deleted' });
    } catch (err) { res.status(500).json({ error: 'Failed to delete messages' }); }
});

// Delete Single Message
router.delete('/messages/:id', authenticateWebmail, async (req, res) => {
  try {
    const msg = await EmailMessage.findOne({ _id: req.params.id, mailbox_id: req.user.mailbox_id });
    if (msg) {
        for (const att of msg.attachments) {
            if (att.gridfs_id) await bucket.delete(att.gridfs_id).catch(() => {});
        }
        await msg.deleteOne();
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete message' }); }
});

// Send Email (Supports Large Files via GridFS)
router.post('/send', authenticateWebmail, async (req, res) => {
  try {
    const { to, cc, bcc, subject, htmlBody, attachments } = req.body;
    const sender = await Mailbox.findById(req.user.mailbox_id);
    const fromHeader = sender && (sender.first_name || sender.last_name) 
        ? `"${sender.first_name || ''} ${sender.last_name || ''}".trim() <${req.user.email}>`
        : req.user.email;

    const safeHtml = `<div style="font-family: sans-serif;">${htmlBody}</div>`;
    const plainText = htmlBody.replace(/<[^>]+>/g, ' ');

    // Upload attachments to GridFS
    const processedAttachments = [];
    if (attachments && attachments.length > 0) {
        for (const att of attachments) {
            const buffer = base64ToBuffer(att.content);
            const uploadStream = bucket.openUploadStream(att.filename, {
                contentType: att.contentType
            });
            
            await new Promise((resolve, reject) => {
                const stream = new Readable();
                stream.push(buffer);
                stream.push(null);
                stream.pipe(uploadStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            processedAttachments.push({
                filename: att.filename,
                contentType: att.contentType,
                gridfs_id: uploadStream.id,
                size: buffer.length
            });
        }
    }

    // Save to Sent
    await EmailMessage.create({
      mailbox_id: req.user.mailbox_id,
      direction: 'outbound',
      from: fromHeader,
      to, cc: cc || '', bcc: bcc || '',
      subject: subject || '',
      text_body: plainText,
      html_body: safeHtml,
      has_attachments: processedAttachments.length > 0,
      attachments: processedAttachments,
      folder: 'sent',
      is_read: true
    });

    // Relay (Note: deliverExternal will still try to relay binary, 
    // but internal users will get the GridFS reference via emailService.sendEmail)
    const allRecipients = new Set([
        ...to.split(/[;,]+/).map(r => r.trim()).filter(r => r),
        ...(cc ? cc.split(/[;,]+/).map(r => r.trim()).filter(r => r) : []),
        ...(bcc ? bcc.split(/[;,]+/).map(r => r.trim()).filter(r => r) : [])
    ]);

    for (const recipientEmail of allRecipients) {
        // We pass the gridfs_ids here. The service will need to handle binary for external.
        await emailService.sendEmail(fromHeader, recipientEmail, subject, plainText, safeHtml, {
            cc, bcc, attachments: processedAttachments
        });
    }

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    logger.error('Send Error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
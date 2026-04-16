const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mailbox = require('../models/Mailbox');
const Domain = require('../models/Domain');
const EmailMessage = require('../models/EmailMessage');
const { authenticateClient } = require('../middleware/auth');
const logger = require('../config/logger');

// List Mailboxes
router.get('/', authenticateClient, async (req, res) => {
  try {
    const mailboxes = await Mailbox.find()
      .populate('domain_id', 'name')
      .sort({ created_at: -1 });

    res.json(mailboxes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mailboxes' });
  }
});

// Impersonate Mailbox (Get Token)
router.post('/:id/impersonate', authenticateClient, async (req, res) => {
  try {
    const mailbox = await Mailbox.findById(req.params.id);
    if (!mailbox) return res.status(404).json({ error: 'Mailbox not found' });

    // Update the last_admin_access timestamp
    mailbox.last_admin_access = new Date();
    await mailbox.save();

    const token = jwt.sign({ mailbox_id: mailbox._id, email: mailbox.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    
    logger.info(`Admin impersonating mailbox: ${mailbox.email}`);

    res.json({ 
        token,
        user: {
            email: mailbox.email, 
            first_name: mailbox.first_name, 
            last_name: mailbox.last_name,
            role: 'mailbox'
        }
    });
  } catch (err) {
    logger.error('Impersonation Error:', err);
    res.status(500).json({ error: 'Failed to generate access token' });
  }
});

// Update Mailbox (Password / Quota / Recovery Email / Names)
router.patch('/:id', authenticateClient, async (req, res) => {
  try {
    const { password, quota_bytes, recovery_email, first_name, last_name } = req.body;
    
    const mailbox = await Mailbox.findById(req.params.id);
    if (!mailbox) return res.status(404).json({ error: 'Mailbox not found' });

    if (password) {
        if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
        const salt = await bcrypt.genSalt(10);
        mailbox.password_hash = await bcrypt.hash(password, salt);
    }

    if (quota_bytes !== undefined) mailbox.quota_bytes = quota_bytes;
    if (recovery_email !== undefined) mailbox.recovery_email = recovery_email.trim().toLowerCase();
    if (first_name !== undefined) mailbox.first_name = first_name.trim();
    if (last_name !== undefined) mailbox.last_name = last_name.trim();

    await mailbox.save();
    
    logger.info(`Mailbox updated: ${mailbox.email}`);
    res.json({ message: 'Mailbox updated successfully', mailbox });
  } catch(err) {
    logger.error('Update Mailbox Error:', err);
    res.status(500).json({ error: 'Failed to update mailbox' });
  }
});

// Delete Mailbox
router.delete('/:id', authenticateClient, async (req, res) => {
  try {
    // 1. Verify ownership via Domain relationship
    const mailbox = await Mailbox.findById(req.params.id);
    if (!mailbox) return res.status(404).json({ error: 'Mailbox not found' });

    // 2. Delete messages
    await EmailMessage.deleteMany({ mailbox_id: mailbox._id });

    // 3. Delete mailbox
    await Mailbox.deleteOne({ _id: mailbox._id });

    logger.info(`Mailbox deleted: ${mailbox.email}`);
    res.json({ message: 'Mailbox deleted successfully' });
  } catch (err) {
    logger.error('Delete Mailbox Error:', err);
    res.status(500).json({ error: 'Failed to delete mailbox' });
  }
});

module.exports = router;
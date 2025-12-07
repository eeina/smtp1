const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Mailbox = require('../models/Mailbox');
const Domain = require('../models/Domain');
const EmailMessage = require('../models/EmailMessage');
const { authenticateClient } = require('../middleware/auth');
const logger = require('../config/logger');

// List Mailboxes
router.get('/', authenticateClient, async (req, res) => {
  try {
    // Find all domains owned by client
    const domains = await Domain.find({ client_id: req.user.client_id }).select('_id');
    const domainIds = domains.map(d => d._id);

    const mailboxes = await Mailbox.find({ domain_id: { $in: domainIds } })
      .populate('domain_id', 'name')
      .sort({ created_at: -1 });

    res.json(mailboxes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mailboxes' });
  }
});

// Update Mailbox (Password / Quota / Recovery Email)
router.patch('/:id', authenticateClient, async (req, res) => {
  try {
    const { password, quota_bytes, recovery_email } = req.body;
    
    const mailbox = await Mailbox.findById(req.params.id);
    if (!mailbox) return res.status(404).json({ error: 'Mailbox not found' });

    // Verify ownership via Domain
    const domain = await Domain.findOne({ _id: mailbox.domain_id, client_id: req.user.client_id });
    if (!domain) return res.status(403).json({ error: 'Access denied' });

    if (password) {
        if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
        const salt = await bcrypt.genSalt(10);
        mailbox.password_hash = await bcrypt.hash(password, salt);
    }

    if (quota_bytes !== undefined) {
        mailbox.quota_bytes = quota_bytes;
    }

    if (recovery_email !== undefined) {
        mailbox.recovery_email = recovery_email.trim().toLowerCase();
    }

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

    const domain = await Domain.findOne({ _id: mailbox.domain_id, client_id: req.user.client_id });
    if (!domain) return res.status(403).json({ error: 'Access denied' });

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
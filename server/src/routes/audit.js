const express = require('express');
const router = express.Router();
const Domain = require('../models/Domain');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
const { authenticateClient } = require('../middleware/auth');
const logger = require('../config/logger');

// Get Global Message Log (Audit)
router.get('/messages', authenticateClient, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const direction = req.query.direction; // 'inbound' | 'outbound' | ''

    // 1. Find all domains owned by client
    const domains = await Domain.find({ client_id: req.user.client_id }).select('_id');
    const domainIds = domains.map(d => d._id);

    // 2. Find all mailboxes for these domains
    const mailboxes = await Mailbox.find({ domain_id: { $in: domainIds } }).select('_id');
    const mailboxIds = mailboxes.map(m => m._id);

    // 3. Build Query
    const query = { mailbox_id: { $in: mailboxIds } };

    if (direction && (direction === 'inbound' || direction === 'outbound')) {
        query.direction = direction;
    }

    if (search) {
        // Escape special regex chars if needed, but simple for now
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { from: searchRegex },
            { to: searchRegex },
            { subject: searchRegex }
        ];
    }
    
    const [messages, total] = await Promise.all([
      EmailMessage.find(query)
        .populate('mailbox_id', 'email') // Populate the owner's email
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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
    logger.error('Audit Log Error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
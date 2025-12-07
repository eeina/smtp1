const express = require('express');
const router = express.Router();
const Mailbox = require('../models/Mailbox');
const Domain = require('../models/Domain');
const { authenticateClient } = require('../middleware/auth');

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

module.exports = router;

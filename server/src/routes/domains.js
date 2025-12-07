const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Domain = require('../models/Domain');
const Mailbox = require('../models/Mailbox');
const domainService = require('../services/domain.service');
const { authenticateClient } = require('../middleware/auth');
const logger = require('../config/logger');

// Add Domain
router.post('/', authenticateClient, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Domain name required' });

    const token = domainService.generateVerificationToken();

    const domain = await Domain.create({
      client_id: req.user.client_id,
      name: name.toLowerCase(),
      verification_token: token
    });

    res.status(201).json(domain);
  } catch (err) {
    logger.error('Add Domain Error:', err);
    if (err.code === 11000) return res.status(400).json({ error: 'Domain already registered' });
    res.status(500).json({ error: 'Failed to add domain' });
  }
});

// Verify Domain
router.post('/:id/verify', authenticateClient, async (req, res) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id, client_id: req.user.client_id });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const isVerified = await domainService.verifyDomainDns(domain.name, domain.verification_token);

    if (isVerified) {
      const keys = domainService.generateDkimKeys();
      const mxExists = await domainService.checkMxRecord(domain.name);
      
      domain.is_verified = true;
      domain.mx_status = mxExists ? 'active' : 'pending';
      domain.dkim_private_key = keys.privateKey;
      domain.dkim_public_key = keys.publicKey;
      await domain.save();
      
      res.json({ message: 'Domain verified', domain });
    } else {
      res.status(400).json({ error: 'DNS verification failed. Token not found in TXT records.' });
    }
  } catch (err) {
    logger.error('Verify Domain Error:', err);
    res.status(500).json({ error: 'Verification error' });
  }
});

// List Domains
router.get('/', authenticateClient, async (req, res) => {
  try {
    const domains = await Domain.find({ client_id: req.user.client_id });
    res.json(domains);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// Create Mailbox for Domain
router.post('/:id/mailboxes', authenticateClient, async (req, res) => {
  try {
    const { email, password, quota_bytes } = req.body;
    
    // Verify domain ownership
    const domain = await Domain.findOne({ _id: req.params.id, client_id: req.user.client_id });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });
    if (!domain.is_verified) return res.status(400).json({ error: 'Domain not verified' });
    
    // Check if email ends with domain.name
    if (!email.toLowerCase().endsWith(`@${domain.name}`)) {
      return res.status(400).json({ error: `Email must end with @${domain.name}` });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const mailbox = await Mailbox.create({
      domain_id: domain._id,
      email,
      password_hash,
      quota_bytes: quota_bytes || 1073741824
    });

    res.status(201).json({ message: 'Mailbox created', mailbox_id: mailbox._id });
  } catch (err) {
    logger.error('Create Mailbox Error:', err);
    if (err.code === 11000) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to create mailbox' });
  }
});

module.exports = router;

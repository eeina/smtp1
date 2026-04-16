const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Domain = require('../models/Domain');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
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

// Delete Domain
router.delete('/:id', authenticateClient, async (req, res) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    // Find all mailboxes associated with this domain
    const mailboxes = await Mailbox.find({ domain_id: domain._id });
    const mailboxIds = mailboxes.map(m => m._id);

    // 1. Delete all messages for these mailboxes
    await EmailMessage.deleteMany({ mailbox_id: { $in: mailboxIds } });

    // 2. Delete all mailboxes
    await Mailbox.deleteMany({ domain_id: domain._id });

    // 3. Delete the domain
    await Domain.deleteOne({ _id: domain._id });

    logger.info(`Domain deleted: ${domain.name} (Client: ${req.user.client_id})`);
    res.json({ message: 'Domain and associated data deleted successfully' });
  } catch (err) {
    logger.error('Delete Domain Error:', err);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
});

// Verify Domain
router.post('/:id/verify', authenticateClient, async (req, res) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id });
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

// Check DNS Status
router.get('/:id/dns', authenticateClient, async (req, res) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const status = await domainService.getDnsStatus(domain.name, domain.verification_token);
    res.json(status);
  } catch (err) {
    logger.error('DNS Status Error:', err);
    res.status(500).json({ error: 'Failed to check DNS status' });
  }
});

// List Domains
router.get('/', authenticateClient, async (req, res) => {
  try {
    const domains = await Domain.find();
    res.json(domains);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// Create Mailbox for Domain
router.post('/:id/mailboxes', authenticateClient, async (req, res) => {
  try {
    const { email, password, quota_bytes, recovery_email, first_name, last_name } = req.body;
    
    logger.info(`[Mailbox Creation] Attempting to create mailbox. Payload email: "${email}"`);

    // Verify domain
    const domain = await Domain.findOne({ _id: req.params.id });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });
    if (!domain.is_verified) return res.status(400).json({ error: 'Domain not verified' });
    
    // Strict email validation
    const emailParts = email.toLowerCase().split('@');
    if (emailParts.length !== 2 || emailParts[1] !== domain.name) {
      logger.warn(`[Mailbox Creation] Invalid email format rejected: "${email}". Expected format: username@${domain.name}`);
      return res.status(400).json({ error: `Invalid email format. Must be exactly username@${domain.name} without duplicates.` });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const mailbox = await Mailbox.create({
      domain_id: domain._id,
      email,
      password_hash,
      quota_bytes: quota_bytes || 1073741824,
      recovery_email: recovery_email ? recovery_email.trim().toLowerCase() : undefined,
      first_name: first_name ? first_name.trim() : undefined,
      last_name: last_name ? last_name.trim() : undefined
    });

    res.status(201).json({ message: 'Mailbox created', mailbox_id: mailbox._id });
  } catch (err) {
    logger.error('Create Mailbox Error:', err);
    if (err.code === 11000) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to create mailbox' });
  }
});

module.exports = router;
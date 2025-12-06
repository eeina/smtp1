require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const smtpServer = require('./src/smtp/server');
const logger = require('./src/config/logger');
const seedDatabase = require('./src/config/seed');

// Models
const Client = require('./src/models/Client');
const Domain = require('./src/models/Domain');
const Mailbox = require('./src/models/Mailbox');
const EmailMessage = require('./src/models/EmailMessage');

// Services
const domainService = require('./src/services/domain.service');

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.info('MongoDB Connected');
    await seedDatabase();
  })
  .catch(err => logger.error('MongoDB Connection Error:', err));

// --- MIDDLEWARE ---

const authenticateClient = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access Denied: No Token Provided' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (!verified.client_id) return res.status(403).json({ error: 'Access Denied: Invalid Token Type' });
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};

const authenticateWebmail = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access Denied: No Token Provided' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (!verified.mailbox_id) return res.status(403).json({ error: 'Access Denied: Invalid Token Type' });
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};

// --- AUTH ROUTES (CLIENT) ---

// Register Client
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, company_name } = req.body;

    const existing = await Client.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const client = await Client.create({
      email,
      password_hash,
      company_name
    });

    res.status(201).json({ message: 'Client registered successfully', client_id: client._id });
  } catch (err) {
    logger.error('Registration Error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login Client
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const client = await Client.findOne({ email });
    if (!client) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, client.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ client_id: client._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, client: { email: client.email, company_name: client.company_name } });
  } catch (err) {
    logger.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- DOMAIN ROUTES ---

// Add Domain
app.post('/api/domains', authenticateClient, async (req, res) => {
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
app.post('/api/domains/:id/verify', authenticateClient, async (req, res) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id, client_id: req.user.client_id });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const isVerified = await domainService.verifyDomainDns(domain.name, domain.verification_token);

    if (isVerified) {
      const keys = domainService.generateDkimKeys();
      // Use real MX check instead of mock status
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
app.get('/api/domains', authenticateClient, async (req, res) => {
  try {
    const domains = await Domain.find({ client_id: req.user.client_id });
    res.json(domains);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// --- MAILBOX ROUTES ---

// Create Mailbox
app.post('/api/domains/:id/mailboxes', authenticateClient, async (req, res) => {
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

// List Mailboxes
app.get('/api/mailboxes', authenticateClient, async (req, res) => {
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

// --- WEBMAIL ROUTES (USER) ---

// Webmail Login
app.post('/api/webmail/login', async (req, res) => {
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
app.get('/api/webmail/messages', authenticateWebmail, async (req, res) => {
  try {
    const messages = await EmailMessage.find({ mailbox_id: req.user.mailbox_id })
      .sort({ created_at: -1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Start Servers
const PORT = process.env.PORT || 4000;
const SMTP_PORT = process.env.SMTP_PORT || 2525;
const SUBMISSION_PORT = process.env.SUBMISSION_PORT || 5870;

app.listen(PORT, () => {
  logger.info(`Express Server running on port ${PORT}`);
});

smtpServer.start(SMTP_PORT, SUBMISSION_PORT);
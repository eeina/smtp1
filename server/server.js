require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const smtp = require('./src/smtp/smtp');
const EmailLog = require('./src/models/EmailLog');
const logger = require('./src/config/logger');

const app = express();

// Security Headers
app.use(helmet());
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('MongoDB Connected'))
  .catch(err => logger.error('MongoDB Connection Error:', err));

// API Routes
app.get('/api/emails', async (req, res) => {
  try {
    const emails = await EmailLog.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(emails);
  } catch (err) {
    logger.error('Error fetching emails:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Express server running on port ${PORT}`);
});

// Start SMTP Server
const SMTP_PORT = process.env.SMTP_PORT || 2525;
smtp.listen(SMTP_PORT, () => {
  logger.info(`SMTP server running on port ${SMTP_PORT}`);
});
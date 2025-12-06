require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const smtp = require('./src/smtp/smtp');
const EmailLog = require('./src/models/EmailLog');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// API Routes
app.get('/api/emails', async (req, res) => {
  try {
    const emails = await EmailLog.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(emails);
  } catch (err) {
    console.error('Error fetching emails:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Start Express Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});

// Start SMTP Server
const SMTP_PORT = 2525;
smtp.listen(SMTP_PORT, () => {
  console.log(`SMTP server running on port ${SMTP_PORT}`);
});
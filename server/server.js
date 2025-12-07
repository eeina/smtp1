require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const smtpServer = require('./src/smtp/server');
const logger = require('./src/config/logger');
const seedDatabase = require('./src/config/seed');

// Routes Imports
const clientAuthRoutes = require('./src/routes/clientAuth');
const domainRoutes = require('./src/routes/domains');
const mailboxRoutes = require('./src/routes/mailboxes');
const webmailRoutes = require('./src/routes/webmail');

const app = express();

// Security & Middleware
app.use(helmet());

// Robust CORS Configuration
const corsOptions = {
  origin: 'https://smtp.eeina.com', // Explicitly allow your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Enable if you ever need cookies, good practice
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));
// Explicitly handle OPTIONS preflight requests for all routes just in case
app.options('*', cors(corsOptions));

app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.info('MongoDB Connected');
    await seedDatabase();
  })
  .catch(err => logger.error('MongoDB Connection Error:', err));

// --- MOUNT ROUTES ---
app.use('/api/auth', clientAuthRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/mailboxes', mailboxRoutes);
app.use('/api/webmail', webmailRoutes);

// Start Servers
const PORT = process.env.PORT || 4000;
const SMTP_PORT = process.env.SMTP_PORT || 2525;
const SUBMISSION_PORT = process.env.SUBMISSION_PORT || 5870;

app.listen(PORT, () => {
  logger.info(`Express Server running on port ${PORT}`);
});

smtpServer.start(SMTP_PORT, SUBMISSION_PORT);

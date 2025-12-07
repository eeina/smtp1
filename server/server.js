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
const accountRoutes = require('./src/routes/account');
const domainRoutes = require('./src/routes/domains');
const mailboxRoutes = require('./src/routes/mailboxes');
const webmailRoutes = require('./src/routes/webmail');
const systemRoutes = require('./src/routes/system');
const unifiedAuthRoutes = require('./src/routes/unifiedAuth');

const app = express();

// --- CORS CONFIGURATION (MUST BE FIRST) ---
const corsOptions = {
  origin: true, // Reflects the request origin (e.g., https://smtp.eeina.com)
  credentials: true, // Required for authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// --- SECURITY & MIDDLEWARE ---
// HELMET FIX: Explicitly allow cross-origin resource sharing
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json());

// Request Logger (Debug)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    // console.log(`${req.method} ${req.path} - Origin: ${req.get('origin')}`);
  }
  next();
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.info('MongoDB Connected');
    await seedDatabase();
  })
  .catch(err => logger.error('MongoDB Connection Error:', err));

// --- MOUNT ROUTES ---
app.use('/api/auth', clientAuthRoutes); // Keep for legacy or specific client endpoints if needed
app.use('/api/login', unifiedAuthRoutes); // New Unified Login
app.use('/api/account', accountRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/mailboxes', mailboxRoutes);
app.use('/api/webmail', webmailRoutes);
app.use('/api/system', systemRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Servers
const PORT = process.env.PORT || 4000;
const SMTP_PORT = process.env.SMTP_PORT || 2525;
const SUBMISSION_PORT = process.env.SUBMISSION_PORT || 5870;

app.listen(PORT, () => {
  logger.info(`Express Server running on port ${PORT}`);
});

smtpServer.start(SMTP_PORT, SUBMISSION_PORT);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const smtpServer = require('./src/smtp/server');
const pop3Server = require('./src/pop3/server');
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
const auditRoutes = require('./src/routes/audit');
const adminRoutes = require('./src/routes/admins');

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// INCREASED LIMIT FOR LARGE ATTACHMENTS (>100MB)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

app.use((req, res, next) => {
  next();
});

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.info('MongoDB Connected');
    await seedDatabase();
  })
  .catch(err => logger.error('MongoDB Connection Error:', err));

app.use('/api/auth', clientAuthRoutes);
app.use('/api/login', unifiedAuthRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/mailboxes', mailboxRoutes);
app.use('/api/webmail', webmailRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admins', adminRoutes);

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
const SMTP_PORT = process.env.SMTP_PORT || 2525;
const SUBMISSION_PORT = process.env.SUBMISSION_PORT || 5870;
const POP3_PORT = process.env.POP3_PORT || 1100;

app.listen(PORT, () => {
  logger.info(`Express Server running on port ${PORT}`);
});

smtpServer.start(SMTP_PORT, SUBMISSION_PORT);
pop3Server.start(POP3_PORT);
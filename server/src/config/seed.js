const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const Domain = require('../models/Domain');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
const logger = require('./logger');
const domainService = require('../services/domain.service');

const seedDatabase = async () => {
  try {
    // Check if seeding is already done
    const existingClient = await Client.findOne({ email: 'admin@example.com' });
    if (existingClient) {
      logger.info('Database already seeded.');
      return;
    }

    logger.info('Seeding database with initial data...');

    // 1. Create Client (Admin)
    const salt = await bcrypt.genSalt(10);
    const clientPassword = await bcrypt.hash('password123', salt);
    
    const client = await Client.create({
      email: 'admin@example.com',
      password_hash: clientPassword,
      company_name: 'Example Corp'
    });
    
    // 2. Create Domain
    const domainName = 'example.com';
    const keys = domainService.generateDkimKeys();
    const domain = await Domain.create({
      client_id: client._id,
      name: domainName,
      verification_token: domainService.generateVerificationToken(),
      is_verified: true,
      mx_status: 'active',
      dkim_private_key: keys.privateKey,
      dkim_public_key: keys.publicKey
    });

    // 3. Create Mailbox
    const mailboxPassword = await bcrypt.hash('password123', salt);
    const mailbox = await Mailbox.create({
      domain_id: domain._id,
      email: `user@${domainName}`,
      password_hash: mailboxPassword,
      quota_bytes: 1073741824
    });

    // 4. Create Email Messages
    await EmailMessage.create([
      {
        mailbox_id: mailbox._id,
        direction: 'inbound',
        from: 'system@smtp-service.com',
        to: mailbox.email,
        subject: 'Welcome to your Inbox',
        text_body: 'This is a seeded email message to get you started.',
        html_body: '<div style="font-family: sans-serif; padding: 20px; background: #f9f9f9; border-radius: 5px;"><h2>Welcome!</h2><p>This is a <strong>seeded</strong> email message to get you started with the platform.</p></div>',
        folder: 'inbox',
        is_read: false,
        created_at: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        mailbox_id: mailbox._id,
        direction: 'outbound',
        from: mailbox.email,
        to: 'external@test.com',
        subject: 'Sent Item Test',
        text_body: 'This email appears in your sent items.',
        html_body: '<p>This email appears in your sent items.</p>',
        folder: 'sent',
        is_read: true,
        created_at: new Date()
      }
    ]);

    logger.info('Database seeding completed successfully.');
    logger.info('Credentials -> Client: admin@example.com / password123 | Mailbox: user@example.com / password123');

  } catch (error) {
    logger.error('Seeding Error:', error);
  }
};

module.exports = seedDatabase;
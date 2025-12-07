const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const bcrypt = require('bcryptjs');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
const emailService = require('../services/email.service');
const logger = require('../config/logger');

// Authenticate user against Mailbox database for Port 587
const onAuth = async (auth, session, callback) => {
  try {
    const mailbox = await Mailbox.findOne({ email: auth.username });
    if (!mailbox) {
      return callback(new Error('Invalid username or password'));
    }

    const isMatch = await bcrypt.compare(auth.password, mailbox.password_hash);
    if (!isMatch) {
      return callback(new Error('Invalid username or password'));
    }

    // Attach mailbox to session for later use
    session.user = {
      _id: mailbox._id,
      email: mailbox.email,
      domain_id: mailbox.domain_id,
      name: `${mailbox.first_name || ''} ${mailbox.last_name || ''}`.trim()
    };
    
    callback(null, { user: mailbox.email });
  } catch (err) {
    logger.error('Auth Error:', err);
    callback(new Error('Authentication failed'));
  }
};

// Validate Recipient
// If Authenticated: Allow any recipient (Outbound)
// If Localhost: Allow (System Notifications)
// If Guest: Recipient must be a local Mailbox (Inbound)
const onRcptTo = async (address, session, callback) => {
  try {
    // 1. Allow Authenticated Users (Outbound)
    if (session.user) {
      return callback(); 
    }

    // 2. Allow Localhost / Internal System (Password Resets, Alerts)
    // This prevents "550 Relaying Denied" when the app sends to itself
    const remoteIP = session.remoteAddress;
    if (remoteIP === '127.0.0.1' || remoteIP === '::1' || remoteIP === '::ffff:127.0.0.1') {
        return callback();
    }

    // 3. Inbound (Guest/Internet) -> Check if recipient exists locally
    const mailbox = await Mailbox.findOne({ email: address.address });
    if (!mailbox) {
      // Reject unknown recipients to prevent backscatter/spam
      return callback(new Error('550 Relaying denied'));
    }

    // Valid local recipient
    callback();
  } catch (err) {
    logger.error('RcptTo Error:', err);
    callback(new Error('Internal server error'));
  }
};

// Process Data Stream
const onData = (stream, session, callback) => {
  simpleParser(stream, async (err, parsed) => {
    if (err) {
      logger.error('Parse Error:', err);
      return callback(new Error('Error parsing email'));
    }

    try {
      const { from, to, subject, text, html } = parsed;
      const fromAddress = from ? from.text : ''; 
      
      // Handle To addresses (can be array or object)
      const toAddressStr = Array.isArray(to) 
        ? to.map(t => t.text).join(', ') 
        : (to ? to.text : '');

      if (session.user) {
        // --- OUTBOUND (Authenticated User) ---
        
        // 1. Save to Sender's 'Sent' folder
        await EmailMessage.create({
          mailbox_id: session.user._id,
          direction: 'outbound',
          from: fromAddress,
          to: toAddressStr,
          subject: subject || '',
          text_body: text || '',
          html_body: html || '',
          folder: 'sent',
          is_read: true
        });
        logger.info(`OUTBOUND saved to DB for ${session.user.email}`);

        // 2. DELIVER THE EMAIL (Relay)
        const recipients = session.envelope.rcptTo.map(r => r.address);
        for (const recipient of recipients) {
             await emailService.sendEmail(fromAddress, recipient, subject, text, html);
        }

      } else {
        // --- INBOUND (Internet or Localhost) ---
        // Save to EACH valid local Recipient's 'Inbox'
        const recipients = session.envelope.rcptTo;
        
        let deliveredCount = 0;
        for (const recipient of recipients) {
          const mailbox = await Mailbox.findOne({ email: recipient.address });
          if (mailbox) {
            await EmailMessage.create({
              mailbox_id: mailbox._id,
              direction: 'inbound',
              from: fromAddress,
              to: recipient.address,
              subject: subject || '',
              text_body: text || '',
              html_body: html || '',
              folder: 'inbox',
              is_read: false
            });
            logger.info(`INBOUND saved for ${mailbox.email}`);
            deliveredCount++;
          } else {
             // If we allowed it in rcptTo (e.g. localhost) but user doesn't exist, we just drop it gracefully here.
             logger.warn(`Dropped email for unknown user ${recipient.address} (allowed via whitelist)`);
          }
        }
      }
      
      callback();
    } catch (error) {
      logger.error('Data Save Error:', error);
      callback(new Error('Error saving to database'));
    }
  });
};

// Server for Port 25 (Inbound, No Auth required for delivery to local users)
const server25 = new SMTPServer({
  secure: false,
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onRcptTo,
  onData,
  logger: false 
});

// Server for Port 587 (Submission, Auth Required)
const server587 = new SMTPServer({
  secure: false,
  authOptional: false, // Auth is mandatory
  disabledCommands: ['STARTTLS'],
  onAuth,
  onRcptTo,
  onData,
  logger: false
});

module.exports = {
  start: (port25 = 25, port587 = 587) => {
    server25.listen(port25, () => logger.info(`SMTP Inbound Server (Public) running on port ${port25}`));
    server587.listen(port587, () => logger.info(`SMTP Submission Server (Client) running on port ${port587}`));
  }
};
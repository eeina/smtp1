
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
const emailService = require('../services/email.service');
const logger = require('../config/logger');

// Initialize GridFS Bucket lazily or after connection
let bucket;
const getBucket = () => {
    if (!bucket && mongoose.connection.readyState === 1) {
        bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'attachments'
        });
    }
    return bucket;
};

// Authenticate user against Mailbox database for Port 587
const onAuth = async (auth, session, callback) => {
  try {
    const mailbox = await Mailbox.findOne({ email: auth.username.toLowerCase() });
    if (!mailbox) {
      return callback(new Error('Invalid username or password'));
    }

    const isMatch = await bcrypt.compare(auth.password, mailbox.password_hash);
    if (!isMatch) {
      return callback(new Error('Invalid username or password'));
    }

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

const onRcptTo = async (address, session, callback) => {
  try {
    if (session.user) return callback(); 

    const remoteIP = session.remoteAddress;
    if (remoteIP === '127.0.0.1' || remoteIP === '::1' || remoteIP === '::ffff:127.0.0.1') {
        return callback();
    }

    const mailbox = await Mailbox.findOne({ email: address.address.toLowerCase() });
    if (!mailbox) return callback(new Error('550 Relaying denied'));

    callback();
  } catch (err) {
    logger.error('RcptTo Error:', err);
    callback(new Error('Internal server error'));
  }
};

const onData = (stream, session, callback) => {
  simpleParser(stream, async (err, parsed) => {
    if (err) {
      logger.error('Parse Error:', err);
      return callback(new Error('Error parsing email'));
    }

    try {
      const { from, to, subject, text, html, attachments } = parsed;
      const fromAddress = from ? from.text : 'Unknown'; 
      const toAddressStr = Array.isArray(to) ? to.map(t => t.text).join(', ') : (to ? to.text : '');

      const currentBucket = getBucket();
      const processedAttachments = [];

      if (attachments && attachments.length > 0 && currentBucket) {
          for (const att of attachments) {
              const uploadStream = currentBucket.openUploadStream(att.filename || 'unnamed', {
                  contentType: att.contentType
              });
              
              await new Promise((resolve, reject) => {
                  const s = new Readable();
                  s.push(att.content);
                  s.push(null);
                  s.pipe(uploadStream)
                      .on('finish', resolve)
                      .on('error', reject);
              });

              processedAttachments.push({
                  filename: att.filename || 'unnamed',
                  contentType: att.contentType,
                  gridfs_id: uploadStream.id,
                  size: att.size
              });
          }
      }

      if (session.user) {
        if (session.user._id) {
            await EmailMessage.create({
              mailbox_id: session.user._id,
              direction: 'outbound',
              from: fromAddress,
              to: toAddressStr,
              subject: subject || '',
              text_body: text || '',
              html_body: html || '',
              has_attachments: processedAttachments.length > 0,
              attachments: processedAttachments,
              folder: 'sent',
              is_read: true
            });
        }

        const recipients = session.envelope.rcptTo.map(r => r.address);
        for (const recipient of recipients) {
             await emailService.sendEmail(fromAddress, recipient, subject, text, html, {
                 attachments: processedAttachments
             });
        }
      } else {
        const recipients = session.envelope.rcptTo;
        for (const recipient of recipients) {
          const mailbox = await Mailbox.findOne({ email: recipient.address.toLowerCase() });
          if (mailbox && mailbox._id) {
            await EmailMessage.create({
              mailbox_id: mailbox._id,
              direction: 'inbound',
              from: fromAddress,
              to: recipient.address,
              subject: subject || '',
              text_body: text || '',
              html_body: html || '',
              has_attachments: processedAttachments.length > 0,
              attachments: processedAttachments,
              folder: 'inbox',
              is_read: false
            });
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

const server25 = new SMTPServer({
  secure: false,
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  size: 200 * 1024 * 1024, // 200MB limit for inbound
  onRcptTo,
  onData,
  logger: false 
});

const server587 = new SMTPServer({
  secure: false,
  authOptional: false,
  disabledCommands: ['STARTTLS'],
  size: 200 * 1024 * 1024, // 200MB limit for outbound
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

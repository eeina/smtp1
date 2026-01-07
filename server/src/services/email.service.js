
const dns = require('dns').promises;
const nodemailer = require('nodemailer');
const mongoose = require('mongoose'); // Corrected import
const Mailbox = require('../models/Mailbox');
const Domain = require('../models/Domain');
const EmailMessage = require('../models/EmailMessage');
const SystemConfig = require('../models/SystemConfig');
const logger = require('../config/logger');

let bucket;
const getBucket = () => {
    if (!bucket && mongoose.connection.readyState === 1) {
        bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'attachments'
        });
    }
    return bucket;
};

const extractEmail = (fullAddress) => {
    if (!fullAddress) return '';
    const match = fullAddress.match(/<([^>]+)>/);
    return (match ? match[1] : fullAddress).toLowerCase().trim();
};

const deliverExternal = async (senderEmail, recipientEmail, subject, text, html, options = {}) => {
  try {
    const cleanRecipient = extractEmail(recipientEmail);
    const recipientDomain = cleanRecipient.split('@')[1];
    const mxRecords = await dns.resolveMx(recipientDomain);
    const bestMx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;

    const currentBucket = getBucket();
    
    const attachments = [];
    if (options.attachments) {
        for (const att of options.attachments) {
            if (att.gridfs_id && currentBucket) {
                attachments.push({
                    filename: att.filename,
                    content: currentBucket.openDownloadStream(att.gridfs_id),
                    contentType: att.contentType
                });
            } else if (att.content) {
                attachments.push(att);
            }
        }
    }

    const transporter = nodemailer.createTransport({ 
        host: bestMx, 
        port: 25, 
        secure: false, 
        tls: { rejectUnauthorized: false } 
    });
    
    await transporter.sendMail({
      from: senderEmail, to: recipientEmail, cc: options.cc, bcc: options.bcc,
      subject, text, html, attachments
    });
    return true;
  } catch (error) {
    logger.error(`External Delivery Failed: ${error.message}`);
    return false;
  }
};

const sendEmail = async (from, to, subject, text, html, options = {}) => {
    try {
        const cleanTo = extractEmail(to);
        const recipientMailbox = await Mailbox.findOne({ email: cleanTo });
        if (recipientMailbox) {
            await EmailMessage.create({
                mailbox_id: recipientMailbox._id,
                direction: 'inbound',
                from, to: cleanTo, cc: options.cc || '', bcc: options.bcc || '',
                subject: subject || '', text_body: text || '', html_body: html || '',
                has_attachments: options.attachments && options.attachments.length > 0,
                attachments: options.attachments || [],
                folder: 'inbox', is_read: false
            });
            return true;
        } else {
            return await deliverExternal(from, to, subject, text, html, options);
        }
    } catch (err) {
        logger.error('Email Service Error:', err);
        return false;
    }
};

module.exports = { deliverExternal, sendEmail };

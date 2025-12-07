const dns = require('dns').promises;
const nodemailer = require('nodemailer');
const Mailbox = require('../models/Mailbox');
const Domain = require('../models/Domain');
const Client = require('../models/Client'); // Added to fetch Company Name
const EmailMessage = require('../models/EmailMessage');
const SystemConfig = require('../models/SystemConfig');
const logger = require('../config/logger');

/**
 * Helper: Extract pure email from "Name <email>" format
 */
const extractEmail = (fullAddress) => {
    if (!fullAddress) return '';
    const match = fullAddress.match(/<([^>]+)>/);
    return match ? match[1] : fullAddress;
};

/**
 * Helper: Send email to external server
 */
const deliverExternal = async (senderEmail, recipientEmail, subject, text, html, options = {}) => {
  try {
    const cleanRecipient = extractEmail(recipientEmail);
    const cleanSender = extractEmail(senderEmail);

    const recipientDomain = cleanRecipient.split('@')[1];
    if (!recipientDomain) throw new Error('Invalid recipient domain');

    // 1. Resolve MX Records
    const mxRecords = await dns.resolveMx(recipientDomain);
    if (!mxRecords || mxRecords.length === 0) throw new Error('No MX records found for domain');

    // Sort by priority (lowest number first)
    const bestMx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;
    
    logger.info(`Resolving delivery for ${cleanRecipient}: via ${bestMx}`);

    // 2. Prepare DKIM Signing (Look up using CLEAN sender email)
    let dkimOptions = undefined;
    
    // Check if sender is a Mailbox first
    const senderMailbox = await Mailbox.findOne({ email: cleanSender.toLowerCase() }).populate('domain_id');

    if (senderMailbox && senderMailbox.domain_id && senderMailbox.domain_id.dkim_private_key) {
      dkimOptions = {
        domainName: senderMailbox.domain_id.name,
        keySelector: 'default',
        privateKey: senderMailbox.domain_id.dkim_private_key
      };
    } else {
         // Fallback: Check if the domain itself exists and has keys (for System Emails)
         const senderDomainPart = cleanSender.split('@')[1];
         if (senderDomainPart) {
             const senderDomain = await Domain.findOne({ name: senderDomainPart.toLowerCase() });
             if (senderDomain && senderDomain.dkim_private_key) {
                 dkimOptions = {
                    domainName: senderDomain.name,
                    keySelector: 'default',
                    privateKey: senderDomain.dkim_private_key
                };
             }
         }
    }

    // 3. Get System Config for HELO
    let heloName = process.env.MY_HOSTNAME || 'smtp-server.local';
    try {
        const config = await SystemConfig.findOne({ singleton: true });
        if (config && config.smtp_hostname) {
            heloName = config.smtp_hostname;
        }
    } catch(e) { /* Fallback */ }

    // 4. Create Transporter
    const transporter = nodemailer.createTransport({
      host: bestMx,
      port: 25,
      secure: false,
      tls: { rejectUnauthorized: false },
      name: heloName,
      dkim: dkimOptions
    });

    // 5. Send (Use original senderEmail which might include "Name <email>")
    await transporter.sendMail({
      from: senderEmail, 
      to: recipientEmail,
      cc: options.cc,
      bcc: options.bcc,
      subject: subject,
      text: text,
      html: html,
      attachments: options.attachments
    });
    
    logger.info(`External Delivery Success: ${cleanRecipient} (HELO: ${heloName})`);
    return true;
  } catch (error) {
    logger.error(`External Delivery Failed to ${recipientEmail}: ${error.message}`);
    return false;
  }
};

/**
 * Delivers an email (System or User) handling both local and external recipients.
 * @param {string} from 
 * @param {string} to 
 * @param {string} subject 
 * @param {string} text 
 * @param {string} html 
 * @param {object} options - { cc, bcc, attachments: [{filename, content, contentType}] }
 */
const sendEmail = async (from, to, subject, text, html, options = {}) => {
    try {
        // Main recipient
        const cleanTo = extractEmail(to).toLowerCase().trim();
        
        // Handle local delivery check
        const recipientMailbox = await Mailbox.findOne({ email: cleanTo });
        
        if (recipientMailbox) {
            // --- LOCAL DELIVERY ---
            await EmailMessage.create({
                mailbox_id: recipientMailbox._id,
                direction: 'inbound',
                from: extractEmail(from), // Store clean email in DB for consistency
                to: cleanTo,
                cc: options.cc,
                subject: subject || '',
                text_body: text || '',
                html_body: html || '',
                has_attachments: options.attachments && options.attachments.length > 0,
                folder: 'inbox',
                is_read: false
            });
            logger.info(`Internal Delivery: ${from} -> ${cleanTo}`);
            return true;
        } else {
            // --- EXTERNAL DELIVERY ---
            return await deliverExternal(from, to, subject, text, html, options);
        }
    } catch (err) {
        logger.error('Email Service Error:', err);
        return false;
    }
};

/**
 * Sends a system notification (e.g. OTP)
 * Constructs a Friendly From Address: "Company Name" <noreply@domain.com>
 */
const sendSystemEmail = async (to, subject, text, html) => {
    let fromEmail = 'noreply@system.local';
    let fromName = 'Eeina Security'; // Default Name
    
    try {
        // 1. Fetch Company Name from Admin Client
        const admin = await Client.findOne().sort({ created_at: 1 });
        if (admin && admin.company_name) {
            fromName = admin.company_name;
        }

        // 2. Priority: Use a Verified Domain (noreply@verified.com)
        const validDomain = await Domain.findOne({ is_verified: true });
        
        if (validDomain) {
            fromEmail = `noreply@${validDomain.name}`;
            logger.info(`System Email: Auto-selected sender ${fromEmail} from verified domains.`);
        } else {
            // 3. Fallback: Check System Configuration
            const config = await SystemConfig.findOne({ singleton: true });
            if (config && config.system_email_address && !config.system_email_address.includes('system.local')) {
                fromEmail = config.system_email_address;
            }
        }
    } catch (e) {
        logger.error('System Email Sender Error:', e);
    }

    // Construct "Name <email>" format
    const from = `"${fromName}" <${fromEmail}>`;

    return await sendEmail(from, to, subject, text, html);
};

module.exports = {
    deliverExternal,
    sendEmail,
    sendSystemEmail
};
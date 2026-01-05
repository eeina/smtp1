const dns = require('dns').promises;
const nodemailer = require('nodemailer');
const Mailbox = require('../models/Mailbox');
const Domain = require('../models/Domain');
const Client = require('../models/Client');
const EmailMessage = require('../models/EmailMessage');
const SystemConfig = require('../models/SystemConfig');
const logger = require('../config/logger');

/**
 * Helper: Extract pure email from "Name <email>" format
 */
const extractEmail = (fullAddress) => {
    if (!fullAddress) return '';
    const match = fullAddress.match(/<([^>]+)>/);
    return (match ? match[1] : fullAddress).toLowerCase().trim();
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

    // 2. Prepare DKIM Signing
    let dkimOptions = undefined;
    const senderMailbox = await Mailbox.findOne({ email: cleanSender }).populate('domain_id');

    if (senderMailbox && senderMailbox.domain_id && senderMailbox.domain_id.dkim_private_key) {
      dkimOptions = {
        domainName: senderMailbox.domain_id.name,
        keySelector: 'default',
        privateKey: senderMailbox.domain_id.dkim_private_key
      };
    } else {
         const senderDomainPart = cleanSender.split('@')[1];
         if (senderDomainPart) {
             const senderDomain = await Domain.findOne({ name: senderDomainPart });
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

    // 5. Send
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
    
    logger.info(`External Delivery Success: ${cleanRecipient}`);
    return true;
  } catch (error) {
    logger.error(`External Delivery Failed to ${recipientEmail}: ${error.message}`);
    return false;
  }
};

/**
 * Delivers an email (System or User) handling both local and external recipients.
 */
const sendEmail = async (from, to, subject, text, html, options = {}) => {
    try {
        const cleanTo = extractEmail(to);
        const recipientMailbox = await Mailbox.findOne({ email: cleanTo });
        
        if (recipientMailbox) {
            // --- LOCAL DELIVERY (Mailbox to Mailbox on same server) ---
            await EmailMessage.create({
                mailbox_id: recipientMailbox._id,
                direction: 'inbound',
                from: from, // Keep full "Name <email>" string for UI
                to: cleanTo,
                cc: options.cc || '',
                bcc: options.bcc || '',
                subject: subject || '',
                text_body: text || '',
                html_body: html || '',
                has_attachments: options.attachments && options.attachments.length > 0,
                attachments: options.attachments || [], // CRITICAL FIX: Save the actual files
                folder: 'inbox',
                is_read: false
            });
            logger.info(`Internal Delivery: ${from} -> ${cleanTo}`);
            return true;
        } else {
            // --- EXTERNAL DELIVERY (To Gmail, Outlook, etc) ---
            return await deliverExternal(from, to, subject, text, html, options);
        }
    } catch (err) {
        logger.error('Email Service Error:', err);
        return false;
    }
};

const sendSystemEmail = async (to, subject, text, html) => {
    let fromEmail = 'noreply@system.local';
    let fromName = 'Eeina Security';
    
    try {
        const admin = await Client.findOne().sort({ created_at: 1 });
        if (admin && admin.company_name) fromName = admin.company_name;

        const validDomain = await Domain.findOne({ is_verified: true });
        if (validDomain) {
            fromEmail = `noreply@${validDomain.name}`;
        } else {
            const config = await SystemConfig.findOne({ singleton: true });
            if (config && config.system_email_address && !config.system_email_address.includes('system.local')) {
                fromEmail = config.system_email_address;
            }
        }
    } catch (e) {
        logger.error('System Email Sender Error:', e);
    }

    const from = `"${fromName}" <${fromEmail}>`;
    return await sendEmail(from, to, subject, text, html);
};

module.exports = {
    deliverExternal,
    sendEmail,
    sendSystemEmail
};
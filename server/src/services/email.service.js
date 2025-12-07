const dns = require('dns').promises;
    const nodemailer = require('nodemailer');
    const Mailbox = require('../models/Mailbox');
    const EmailMessage = require('../models/EmailMessage');
    const SystemConfig = require('../models/SystemConfig');
    const logger = require('../config/logger');
    
    /**
     * Helper: Send email to external server
     */
    const deliverExternal = async (senderEmail, recipientEmail, subject, text, html) => {
      try {
        const domainPart = recipientEmail.split('@')[1];
        if (!domainPart) throw new Error('Invalid recipient domain');
    
        // 1. Resolve MX Records
        const mxRecords = await dns.resolveMx(domainPart);
        if (!mxRecords || mxRecords.length === 0) throw new Error('No MX records found for domain');
    
        // Sort by priority (lowest number first)
        const bestMx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;
        
        logger.info(`Resolving delivery for ${recipientEmail}: via ${bestMx}`);
    
        // 2. Prepare DKIM Signing (if sender is local)
        const senderMailbox = await Mailbox.findOne({ email: senderEmail }).populate('domain_id');
        let dkimOptions = undefined;
    
        if (senderMailbox && senderMailbox.domain_id && senderMailbox.domain_id.dkim_private_key) {
          dkimOptions = {
            domainName: senderMailbox.domain_id.name,
            keySelector: 'default',
            privateKey: senderMailbox.domain_id.dkim_private_key
          };
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
          subject: subject,
          text: text,
          html: html
        });
        
        logger.info(`External Delivery Success: ${recipientEmail} (HELO: ${heloName})`);
        return true;
      } catch (error) {
        logger.error(`External Delivery Failed to ${recipientEmail}: ${error.message}`);
        return false;
      }
    };
    
    /**
     * Delivers an email (System or User) handling both local and external recipients.
     */
    const sendEmail = async (from, to, subject, text, html) => {
        try {
            // Check if local
            const recipientMailbox = await Mailbox.findOne({ email: to });
            
            if (recipientMailbox) {
                // --- LOCAL DELIVERY ---
                await EmailMessage.create({
                    mailbox_id: recipientMailbox._id,
                    direction: 'inbound',
                    from: from,
                    to: to,
                    subject: subject || '',
                    text_body: text || '',
                    html_body: html || '',
                    folder: 'inbox',
                    is_read: false
                });
                logger.info(`Internal Delivery: ${from} -> ${to}`);
                return true;
            } else {
                // --- EXTERNAL DELIVERY ---
                return await deliverExternal(from, to, subject, text, html);
            }
        } catch (err) {
            logger.error('Email Service Error:', err);
            return false;
        }
    };
    
    /**
     * Sends a system notification (e.g. OTP)
     */
    const sendSystemEmail = async (to, subject, text, html) => {
        let from = 'noreply@system.local';
        try {
            const config = await SystemConfig.findOne({ singleton: true });
            if (config && config.system_email_address) {
                from = config.system_email_address;
            }
        } catch (e) {}
    
        return await sendEmail(from, to, subject, text, html);
    };
    
    module.exports = {
        deliverExternal,
        sendEmail,
        sendSystemEmail
    };
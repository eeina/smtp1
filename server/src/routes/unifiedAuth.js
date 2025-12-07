const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Client = require('../models/Client');
const Mailbox = require('../models/Mailbox');
const Otp = require('../models/Otp');
const logger = require('../config/logger');
const emailService = require('../services/email.service');

// Unified Login Route
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Try to find as Client (Admin)
    const client = await Client.findOne({ email });
    if (client) {
      const isMatch = await bcrypt.compare(password, client.password_hash);
      if (isMatch) {
        const token = jwt.sign({ client_id: client._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        return res.json({
          token,
          role: 'client',
          email: client.email,
          first_name: client.first_name,
          last_name: client.last_name,
          company_name: client.company_name,
          recovery_email: client.recovery_email
        });
      }
    }

    // 2. Try to find as Mailbox (Webmail User)
    const mailbox = await Mailbox.findOne({ email });
    if (mailbox) {
      const isMatch = await bcrypt.compare(password, mailbox.password_hash);
      if (isMatch) {
        const token = jwt.sign({ mailbox_id: mailbox._id, email: mailbox.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        return res.json({
          token,
          role: 'mailbox',
          email: mailbox.email,
          first_name: mailbox.first_name,
          last_name: mailbox.last_name,
          recovery_email: mailbox.recovery_email
        });
      }
    }

    // 3. Neither found
    return res.status(400).json({ error: 'Invalid email or password' });

  } catch (err) {
    logger.error('Unified Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if(!email) return res.status(400).json({error: "Email is required"});

        // Find user in either collection
        let recoveryEmail = null;
        let userType = null;

        const client = await Client.findOne({ email });
        if(client) {
            userType = 'client';
            recoveryEmail = client.recovery_email;
        } else {
            const mailbox = await Mailbox.findOne({ email });
            if(mailbox) {
                userType = 'mailbox';
                recoveryEmail = mailbox.recovery_email;
            }
        }

        if(!userType) {
            // Return success even if not found to prevent enumeration
            return res.json({ message: "If an account exists, an OTP has been sent." });
        }

        if(!recoveryEmail) {
            return res.status(400).json({ error: "No recovery email configured. Please contact support." });
        }

        // Fetch Company Name for Branding
        const adminClient = await Client.findOne().sort({ created_at: 1 });
        const companyName = adminClient && adminClient.company_name ? adminClient.company_name : 'Eeina';

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        
        // Save OTP
        await Otp.deleteMany({ email }); // Clear old
        await Otp.create({ email, otp });

        // Email Template
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName} Password Reset</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; line-height: 1.6; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container { max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: #ffffff; padding: 32px 24px 0 24px; text-align: center; }
    .header h2 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px 32px; }
    .text-center { text-align: center; }
    .otp-box { background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; border: 1px solid #cbd5e1; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; color: #2563eb; letter-spacing: 8px; line-height: 1; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }
    p { margin-bottom: 16px; font-size: 15px; color: #475569; }
    .info { font-size: 13px; color: #64748b; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h2>${companyName}</h2>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>We received a request to reset the password for <strong>${email}</strong>.</p>
        <p>Your verification code is:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        
        <p class="text-center info">This code will expire in 10 minutes.</p>
        <p class="text-center info" style="margin-top: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.<br/>
        Secure Account System
      </div>
    </div>
  </div>
</body>
</html>
`;

        // Send Email
        const sent = await emailService.sendSystemEmail(
            recoveryEmail,
            `${companyName}: Password Reset Code`, // Friendly Subject
            `Your OTP for ${email} is: ${otp}`,
            emailHtml
        );

        if (!sent) {
             return res.status(500).json({ error: "Failed to deliver OTP email. Please check server logs for SMTP errors." });
        }

        res.json({ message: "OTP sent to recovery email", hasRecovery: true });

    } catch (err) {
        logger.error('Forgot Password Error:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Reset Password - Verify OTP and Update
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if(!email || !otp || !newPassword) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if(newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Verify OTP
        const record = await Otp.findOne({ email, otp });
        if(!record) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        let updated = false;

        // Try Client
        const client = await Client.findOne({ email });
        if(client) {
            client.password_hash = hash;
            await client.save();
            updated = true;
        } else {
            // Try Mailbox
            const mailbox = await Mailbox.findOne({ email });
            if(mailbox) {
                mailbox.password_hash = hash;
                await mailbox.save();
                updated = true;
            }
        }

        if(updated) {
            await Otp.deleteOne({ _id: record._id });
            return res.json({ message: "Password reset successfully. Please login." });
        } else {
            return res.status(404).json({ error: "Account not found" });
        }

    } catch (err) {
        logger.error('Reset Password Error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

module.exports = router;
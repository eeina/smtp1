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
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0; line-height: 1.5; }
    .wrapper { width: 100%; background-color: #f3f4f6; padding: 40px 20px; box-sizing: border-box; }
    .container { max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; }
    .header { background-color: #2563eb; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; }
    .content { padding: 32px 24px; }
    .text-center { text-align: center; }
    .otp-box { background-color: #eff6ff; border: 1px dashed #2563eb; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: #1e40af; letter-spacing: 4px; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #6b7280; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
    p { margin-bottom: 16px; font-size: 16px; }
    .small { font-size: 14px; color: #4b5563; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p class="small">We received a request to reset the password for your account associated with <strong>${email}</strong>.</p>
        <p class="small">Use the code below to complete the reset process:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        
        <p class="small text-center">This code expires in <strong>10 minutes</strong>.</p>
        <p class="small" style="margin-top: 24px; font-size: 13px; color: #9ca3af; text-align: center;">If you didn't ask for this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Secure Webmail. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

        // Send Email
        const sent = await emailService.sendSystemEmail(
            recoveryEmail,
            "Reset Your Password",
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
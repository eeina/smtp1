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

        // Send Email
        await emailService.sendSystemEmail(
            recoveryEmail,
            "Password Reset OTP",
            `Your OTP for ${email} is: ${otp}. It expires in 10 minutes.`,
            `<div style="font-family:sans-serif; padding:20px; border:1px solid #eee; border-radius:5px;">
                <h2>Password Reset</h2>
                <p>You requested a password reset for <strong>${email}</strong>.</p>
                <p style="font-size:24px; font-weight:bold; letter-spacing:5px; margin:20px 0;">${otp}</p>
                <p>If you did not request this, please ignore this email.</p>
             </div>`
        );

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
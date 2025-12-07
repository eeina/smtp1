const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const { authenticateClient } = require('../middleware/auth');
const logger = require('../config/logger');

// Update Profile (Email, Company Name)
router.put('/profile', authenticateClient, async (req, res) => {
  try {
    const { email, company_name } = req.body;
    const client = await Client.findById(req.user.client_id);
    
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Check if email is changing and if it's taken
    if (email && email !== client.email) {
        const exists = await Client.findOne({ email });
        if (exists) return res.status(400).json({ error: 'Email already in use' });
        client.email = email.toLowerCase();
    }

    if (company_name !== undefined) {
        client.company_name = company_name;
    }

    await client.save();
    
    logger.info(`Client profile updated: ${client.email}`);
    res.json({ 
        message: 'Profile updated successfully', 
        user: { email: client.email, company_name: client.company_name } 
    });
  } catch (err) {
    logger.error('Update Profile Error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update Password
router.put('/password', authenticateClient, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const client = await Client.findById(req.user.client_id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, client.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    client.password_hash = await bcrypt.hash(newPassword, salt);
    
    await client.save();

    logger.info(`Client password updated: ${client.email}`);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    logger.error('Update Password Error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
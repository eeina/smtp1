const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const { authenticateClient } = require('../middleware/auth');
const logger = require('../config/logger');

// Get all admins
router.get('/', authenticateClient, async (req, res) => {
    try {
        const admins = await Client.find().select('-password_hash').sort({ created_at: -1 });
        res.json(admins);
    } catch (err) {
        logger.error('Get Admins Error:', err);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Create new admin
router.post('/', authenticateClient, async (req, res) => {
    try {
        const { email, password, first_name, last_name, company_name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await Client.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: 'Admin with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newAdmin = new Client({
            email: email.toLowerCase(),
            password_hash,
            first_name,
            last_name,
            company_name
        });

        await newAdmin.save();
        
        const adminResponse = newAdmin.toObject();
        delete adminResponse.password_hash;

        logger.info(`New admin created by ${req.user.email}: ${email}`);
        res.status(201).json(adminResponse);
    } catch (err) {
        logger.error('Create Admin Error:', err);
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

// Update admin
router.put('/:id', authenticateClient, async (req, res) => {
    try {
        const { email, first_name, last_name, company_name, password } = req.body;
        const admin = await Client.findById(req.params.id);

        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        if (email && email.toLowerCase() !== admin.email) {
            const exists = await Client.findOne({ email: email.toLowerCase() });
            if (exists) return res.status(400).json({ error: 'Email already in use' });
            admin.email = email.toLowerCase();
        }

        if (first_name !== undefined) admin.first_name = first_name;
        if (last_name !== undefined) admin.last_name = last_name;
        if (company_name !== undefined) admin.company_name = company_name;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            admin.password_hash = await bcrypt.hash(password, salt);
        }

        await admin.save();
        
        const adminResponse = admin.toObject();
        delete adminResponse.password_hash;

        logger.info(`Admin updated by ${req.user.email}: ${admin.email}`);
        res.json(adminResponse);
    } catch (err) {
        logger.error('Update Admin Error:', err);
        res.status(500).json({ error: 'Failed to update admin' });
    }
});

// Delete admin
router.delete('/:id', authenticateClient, async (req, res) => {
    try {
        // Prevent self-deletion
        if (req.params.id === req.user.client_id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const admin = await Client.findByIdAndDelete(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        logger.info(`Admin deleted by ${req.user.email}: ${admin.email}`);
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        logger.error('Delete Admin Error:', err);
        res.status(500).json({ error: 'Failed to delete admin' });
    }
});

module.exports = router;

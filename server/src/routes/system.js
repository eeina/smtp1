const express = require('express');
const router = express.Router();
const SystemLog = require('../models/SystemLog');
const SystemConfig = require('../models/SystemConfig');
const { authenticateClient } = require('../middleware/auth');
const diagnosticService = require('../services/diagnostic.service');

// Get recent logs (Admin only)
router.get('/logs', authenticateClient, async (req, res) => {
  try {
    const logs = await SystemLog.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch(e) {
    res.status(500).json({error: 'Failed to fetch logs'});
  }
});

// Get System Config
router.get('/config', authenticateClient, async (req, res) => {
    try {
        let config = await SystemConfig.findOne({ singleton: true });
        if (!config) {
            config = await SystemConfig.create({ singleton: true, smtp_hostname: '' });
        }
        res.json(config);
    } catch(e) {
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

// Update System Config
router.put('/config', authenticateClient, async (req, res) => {
    try {
        const { smtp_hostname, system_email_address } = req.body;
        let config = await SystemConfig.findOne({ singleton: true });
        if (!config) {
            config = new SystemConfig({ singleton: true });
        }
        
        if (smtp_hostname !== undefined) config.smtp_hostname = smtp_hostname.trim();
        if (system_email_address !== undefined) config.system_email_address = system_email_address.trim();

        await config.save();
        
        res.json({ message: 'Configuration saved', config });
    } catch(e) {
        res.status(500).json({ error: 'Failed to update config' });
    }
});

// Run Server Diagnostics
router.get('/diagnostics', authenticateClient, async (req, res) => {
    try {
        const [dnsCheck, portCheck, rdnsCheck, config] = await Promise.all([
            diagnosticService.checkDnsResolution(),
            diagnosticService.checkOutboundPort25(),
            diagnosticService.checkReverseDns(),
            SystemConfig.findOne({ singleton: true })
        ]);

        res.json({
            dns: dnsCheck,
            port25: portCheck,
            rdns: rdnsCheck,
            config: {
                smtp_hostname: config ? config.smtp_hostname : ''
            },
            timestamp: new Date()
        });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Diagnostics failed to run' });
    }
});

// Clear logs
router.delete('/logs', authenticateClient, async (req, res) => {
    try {
        res.json({ message: 'Logs are auto-rotated (Capped Collection)' });
    } catch(e) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
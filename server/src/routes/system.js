const express = require('express');
const router = express.Router();
const SystemLog = require('../models/SystemLog');
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

// Run Server Diagnostics
router.get('/diagnostics', authenticateClient, async (req, res) => {
    try {
        const [dnsCheck, portCheck, rdnsCheck] = await Promise.all([
            diagnosticService.checkDnsResolution(),
            diagnosticService.checkOutboundPort25(),
            diagnosticService.checkReverseDns()
        ]);

        res.json({
            dns: dnsCheck,
            port25: portCheck,
            rdns: rdnsCheck,
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
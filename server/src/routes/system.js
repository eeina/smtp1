const express = require('express');
const router = express.Router();
const SystemLog = require('../models/SystemLog');
const { authenticateClient } = require('../middleware/auth');

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

// Clear logs
router.delete('/logs', authenticateClient, async (req, res) => {
    try {
        // Capped collections can't be cleared easily, but we can drop/recreate or just ignore.
        // Actually capped collections cannot remove documents.
        // We will just return a message saying it's auto-managed.
        res.json({ message: 'Logs are auto-rotated (Capped Collection)' });
    } catch(e) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;

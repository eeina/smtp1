const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  singleton: { type: Boolean, default: true, unique: true },
  smtp_hostname: { type: String, default: '' }, // The HELO/EHLO hostname
  system_email_address: { type: String, default: 'noreply@system.local' } // Sender address for OTPs/Alerts
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  singleton: { type: Boolean, default: true, unique: true },
  smtp_hostname: { type: String, default: '' }, // The HELO/EHLO hostname
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
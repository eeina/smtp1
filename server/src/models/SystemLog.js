const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  level: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, { 
  capped: { size: 5242880, max: 1000 } // Cap at 5MB or 1000 entries
});

module.exports = mongoose.model('SystemLog', systemLogSchema);

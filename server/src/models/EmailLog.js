const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  html: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'received'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
const mongoose = require('mongoose');

const mailboxSchema = new mongoose.Schema({
  domain_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  quota_bytes: {
    type: Number,
    default: 1073741824 // Default 1GB
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mailbox', mailboxSchema);
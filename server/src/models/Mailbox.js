const mongoose = require('mongoose');

const mailboxSchema = new mongoose.Schema({
  domain_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  recovery_email: {
    type: String,
    trim: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true
  },
  quota_bytes: {
    type: Number,
    default: 1073741824 // Default 1GB
  },
  signature: {
    type: String,
    default: ''
  },
  last_admin_access: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mailbox', mailboxSchema);
const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  verification_token: {
    type: String,
    required: true,
    unique: true
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  mx_status: {
    type: String,
    enum: ['pending', 'active'],
    default: 'pending'
  },
  dkim_private_key: {
    type: String
  },
  dkim_public_key: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Domain', domainSchema);
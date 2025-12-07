const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
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
    trim: true,
    lowercase: true
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
  company_name: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Client', clientSchema);
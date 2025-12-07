const mongoose = require('mongoose');

const emailMessageSchema = new mongoose.Schema({
  mailbox_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mailbox',
    required: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  cc: {
    type: String,
    default: ''
  },
  bcc: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    default: ''
  },
  text_body: {
    type: String,
    default: ''
  },
  html_body: {
    type: String,
    default: ''
  },
  has_attachments: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    contentType: String,
    content: Buffer,
    size: Number
  }],
  is_read: {
    type: Boolean,
    default: false
  },
  folder: {
    type: String,
    default: 'inbox'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmailMessage', emailMessageSchema);
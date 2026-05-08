const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true  // Fast lookups when fetching messages for a student
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000   // Guard against huge payloads
  },
  stamp: {
    type: String,
    default: 'heart'
  },
  senderUsn: {
    type: String,
    required: true,
    select: false // Strict omission from public queries
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);

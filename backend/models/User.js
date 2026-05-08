const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  usn: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: false
  },
  deviceDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  otherDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  photo: {
    type: String,
    default: null
  },
  // Attendance tracking
  arrivedAt: {
    type: Date,
    default: null
  },
  scanToken: {
    type: String,
    unique: true,
    sparse: true,
    default: () => crypto.randomUUID()
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

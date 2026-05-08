const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true
  },
  senderUsn: {
    type: String,
    required: true,
    select: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Word', wordSchema);

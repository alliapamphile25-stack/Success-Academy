const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    liveSession: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

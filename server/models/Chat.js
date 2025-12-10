const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'ai'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);
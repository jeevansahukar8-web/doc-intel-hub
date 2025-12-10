const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Simple string for this demo
  filename: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  content: { type: String, required: true }, // The extracted text
});

module.exports = mongoose.model('Document', DocumentSchema);
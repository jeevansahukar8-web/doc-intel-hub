const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true }, // <--- ADD THIS LINE
  uploadDate: { type: Date, default: Date.now },
  content: { type: String, required: true }, 
});

module.exports = mongoose.model('Document', DocumentSchema);
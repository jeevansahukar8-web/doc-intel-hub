require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

const Document = require('./models/Document');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 FIX 1: Serve the 'uploads' folder publicly
// This allows the frontend to access the PDF at http://localhost:5000/uploads/filename.pdf
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Configuration ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI; 
const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

// --- Multer Setup (Disk Storage) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Sanitize filename to prevent issues (spaces -> underscores)
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// --- MongoDB Connection ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// --- Routes ---

// 1. Upload & Send to Gemini
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    console.log(`Processing file: ${req.file.originalname}`);
    const filePath = req.file.path;

    // A. Upload directly to Google's File API (For AI Analysis)
    const uploadResponse = await fileManager.uploadFile(filePath, {
      mimeType: req.file.mimetype,
      displayName: req.file.originalname,
    });

    console.log(`Uploaded to Google! URI: ${uploadResponse.file.uri}`);

    // B. Save Reference to DB
    const newDoc = new Document({
      userId: "demo-user",
      // 🟢 FIX 2: Save the 'filename' (unique name on disk) so the link works
      filename: req.file.filename, 
      // Optional: Save original name if your Schema supports it
      originalName: req.file.originalname,
      // Store the Google URI for the AI to use
      content: uploadResponse.file.uri, 
    });

    await newDoc.save();

    // 🟢 FIX 3: REMOVED 'fs.unlinkSync(filePath)'
    // We do NOT delete the file anymore, so the frontend can display it.

    res.status(201).json({ message: 'File processed successfully', docId: newDoc._id });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// 2. List Documents
app.get('/api/documents', async (req, res) => {
  try {
    // We return both filename (for link) and originalName (if you added it to schema)
    const docs = await Document.find({ userId: "demo-user" });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// 3. AI Chat (Gemini 2.5 Flash)
app.post('/api/chat', async (req, res) => {
  const { docId, question } = req.body;

  try {
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Use the stored Google URI for the AI context
    const fileUri = doc.content; 

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: "application/pdf", 
          fileUri: fileUri
        }
      },
      { text: question }
    ]);

    const response = await result.response;
    const text = response.text();

    res.json({ answer: text });

  } catch (error) {
    console.error("AI Error:", error);
    if (error.message && error.message.includes("404")) {
        res.status(404).json({ error: 'File expired on Google servers. Please re-upload.' });
    } else {
        res.status(500).json({ error: 'AI processing failed' });
    }
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
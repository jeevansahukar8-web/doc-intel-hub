require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

// Import Models
const Document = require('./models/Document');
const User = require('./models/User');
const Chat = require('./models/Chat'); 

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Config
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI; 
const API_KEY = process.env.GEMINI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

// Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- ROUTES ---

// 1. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 2. Document Routes
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Upload to Google
    const uploadResponse = await fileManager.uploadFile(req.file.path, {
      mimeType: req.file.mimetype,
      displayName: req.file.originalname,
    });

    const newDoc = new Document({
      userId: req.user.userId,
      filename: req.file.filename, 
      originalName: req.file.originalname,
      content: uploadResponse.file.uri, 
    });

    await newDoc.save();
    res.status(201).json({ message: 'File processed successfully', doc: newDoc });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.userId });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Document.deleteOne({ _id: req.params.id, userId: req.user.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found or unauthorized' });
    
    // Also delete chat history for this document
    await Chat.deleteOne({ docId: req.params.id, userId: req.user.userId });

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// 3. Chat Routes (UPDATED FOR PERSISTENCE & STRICT ANSWERS)

// Get Chat History
app.get('/api/chat/:docId', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      docId: req.params.docId, 
      userId: req.user.userId 
    });

    // Return messages if found, else empty array
    res.json(chat ? chat.messages : []);
  } catch (error) {
    console.error("Chat Fetch Error:", error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Post Message & Save
app.post('/api/chat', authenticateToken, async (req, res) => {
  const { docId, question } = req.body;

  try {
    const doc = await Document.findOne({ _id: docId, userId: req.user.userId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // 1. Generate AI Response
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // 🟢 UPDATED PROMPT: Strict Context Mode
    const result = await model.generateContent([
      { 
        fileData: { 
          mimeType: "application/pdf", 
          fileUri: doc.content 
        } 
      },
      { 
        text: `You are a strict document assistant. Answer the user's question ONLY using the provided PDF document. 
        - Do not use outside knowledge or general information.
        - If the answer is not found in the document, explicitly say: "I cannot find this information in the provided document."
        - Do not guess.
        
        Question: ${question}` 
      }
    ]);
    
    const answer = (await result.response).text();

    // 2. Save to Database
    let chat = await Chat.findOne({ docId, userId: req.user.userId });
    
    if (!chat) {
      chat = new Chat({ userId: req.user.userId, docId, messages: [] });
    }

    chat.messages.push({ role: 'user', content: question });
    chat.messages.push({ role: 'ai', content: answer });
    chat.lastUpdated = new Date();
    
    await chat.save();

    // 3. Respond
    res.json({ answer });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
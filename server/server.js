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
const mammoth = require('mammoth'); 

// Import Models
const Document = require('./models/Document');
const User = require('./models/User');
const Chat = require('./models/Chat'); 

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads folder publicly so frontend can fetch raw files if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Config
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI; 
const API_KEY = process.env.GEMINI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!API_KEY) {
    console.error("❌ FATAL ERROR: GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

// --- HELPER: RETRY LOGIC FOR 503 ERRORS ---
async function retryWithBackoff(fn, retries = 3, delay = 2000) {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0 || !error.message.includes('503')) {
            throw error;
        }
        console.log(`⚠️ Model Overloaded (503). Retrying in ${delay/1000}s... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
    }
}

// --- HELPER: EXTRACT TEXT FROM LOCAL FILE ---
async function extractTextFromFile(filePath, filename) {
    try {
        if (filename.toLowerCase().endsWith('.docx')) {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } else {
            // Assume text file (txt, md, etc)
            return fs.readFileSync(filePath, 'utf-8');
        }
    } catch (error) {
        console.error("Error extracting text:", error);
        throw new Error("Failed to read document content.");
    }
}

// Multer Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Sanitize filename to prevent issues
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
    const existingUser = await User.findOne({ email });
    if(existingUser) return res.status(400).json({ error: 'User already exists' });

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

// 2. Document Routes (Upload)
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    console.log(`📂 Starting upload for: ${req.file.originalname}`);

    // Validate mime type
    const allowedMimeTypes = [
        'application/pdf', 
        'text/plain', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Only PDF, DOCX, and Text files are supported' });
    }

    // --- FIX FOR VALIDATION ERROR ---
    // We default to "stored_locally" so Mongoose doesn't complain about empty "content".
    // For PDFs, we overwrite this with the actual Google URI.
    let fileUri = "stored_locally"; 

    if (req.file.mimetype === 'application/pdf') {
        const uploadResponse = await fileManager.uploadFile(req.file.path, {
            mimeType: req.file.mimetype,
            displayName: req.file.originalname,
        });
        fileUri = uploadResponse.file.uri;
        console.log(`✅ PDF Uploaded to Google: ${fileUri}`);
    }

    const newDoc = new Document({
      userId: req.user.userId,
      filename: req.file.filename,         
      originalName: req.file.originalname,
      content: fileUri,                    
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
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!doc) return res.status(404).json({ error: 'Not found or unauthorized' });

    // 1. Delete from MongoDB
    await Document.deleteOne({ _id: req.params.id });
    
    // 2. Delete Chat History
    await Chat.deleteOne({ docId: req.params.id });

    // 3. Delete Local File (Cleanup)
    const filePath = path.join(__dirname, 'uploads', doc.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// --- NEW ROUTE: Get Text Content for Preview (Frontend) ---
app.get('/api/doc-content/:id', authenticateToken, async (req, res) => {
    try {
        const doc = await Document.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!doc) return res.status(404).send("Document not found");

        const filePath = path.join(__dirname, 'uploads', doc.filename);
        if (!fs.existsSync(filePath)) return res.status(404).send("File missing on server");

        // Extract text (works for .docx and .txt)
        const text = await extractTextFromFile(filePath, doc.filename);
        res.send(text);

    } catch (err) {
        console.error("Preview Error:", err);
        res.status(500).send("Error reading document content");
    }
});

// 3. Chat Routes
app.get('/api/chat/:docId', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      docId: req.params.docId, 
      userId: req.user.userId 
    });
    res.json(chat ? chat.messages : []);
  } catch (error) {
    console.error("Chat Fetch Error:", error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  const { docId, question } = req.body;

  try {
    const doc = await Document.findOne({ _id: docId, userId: req.user.userId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const isPdf = doc.originalName.toLowerCase().endsWith('.pdf');
    
    // Using gemini-2.5-flash as requested
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log(`🤖 Asking Gemini about ${doc.originalName}...`);

    let promptParts = [];

    if (isPdf) {
        // PDF Strategy: Use Google File Manager URI
        promptParts = [
            { 
                fileData: { 
                    mimeType: 'application/pdf', 
                    fileUri: doc.content 
                } 
            },
            { 
                text: `You are an intelligent document research assistant.
                Answer the question below strictly using the provided document context.
                
                Question: ${question}
                
                Format your answer as:
                **Answer:** [Your answer]
                > **Reference:** "[Direct quote from text]"` 
            }
        ];
    } else {
        // Text/Docx Strategy: Extract locally and embed in prompt
        const filePath = path.join(__dirname, 'uploads', doc.filename);
        
        // This ensures the AI actually sees the file content for non-PDFs
        let textContent = await extractTextFromFile(filePath, doc.filename);

        promptParts = [
            { 
                text: `You are an intelligent document research assistant.
                Here is the content of the document:
                
                """
                ${textContent}
                """
                
                Answer the question below strictly using the document content above.
                
                Question: ${question}
                
                Format your answer as:
                **Answer:** [Your answer]
                > **Reference:** "[Direct quote from text]"` 
            }
        ];
    }

    // --- EXECUTE WITH RETRY LOGIC ---
    const result = await retryWithBackoff(async () => {
        return await model.generateContent(promptParts);
    });
    
    const answer = result.response.text();

    // Save to Database
    let chat = await Chat.findOne({ docId, userId: req.user.userId });
    
    if (!chat) {
      chat = new Chat({ userId: req.user.userId, docId, messages: [] });
    }

    chat.messages.push({ role: 'user', content: question });
    chat.messages.push({ role: 'ai', content: answer });
    chat.lastUpdated = new Date();
    
    await chat.save();

    res.json({ answer });

  } catch (error) {
    console.error("❌ AI Error:", error);

    // Specific error messages
    if (error.message && (error.message.includes('403') || error.message.includes('Forbidden'))) {
       return res.status(403).json({ error: "Permission Denied: Please re-upload this document." });
    }
    if (error.message && error.message.includes('503')) {
        return res.status(503).json({ error: "AI Service Overloaded. Please try again in a few seconds." });
     }

    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
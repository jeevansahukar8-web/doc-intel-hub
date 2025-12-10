DocuMind - AI Document Intelligence Hub

DocuMind is a modern web application that allows users to upload documents (PDF, DOCX, TXT) and interact with them using an intelligent AI chat interface. Powered by Google's Gemini 2.5 Flash model, it provides instant answers based strictly on the content of your uploaded files.

🚀 Features

Multi-Format Support: Upload and process PDF, Word (.docx), and Text (.txt) files.

AI Chat: Ask questions about your documents and get accurate, context-aware answers using Gemini 2.5 Flash.

Document Preview: - Integrated PDF viewer.

Raw text preview for .txt and .docx files.

User Authentication: Secure JWT-based Login and Registration system.

Persistent Storage: Chat history and documents are saved to MongoDB.

Responsive Design: A beautiful, dark-themed UI built with React and Tailwind CSS.

🛠️ Tech Stack

Frontend

React 19 (Vite)

Tailwind CSS (Styling)

Lucide React (Icons)

React Router DOM (Navigation)

React Markdown (Rendering AI responses)

Backend

Node.js & Express

MongoDB (Database) & Mongoose

Google Generative AI SDK (Gemini API)

Multer (File Uploads)

Mammoth (DOCX text extraction)

Bcrypt & JWT (Auth)

⚙️ Installation & Setup

Prerequisites

Node.js (v18+)

MongoDB (Local or Atlas URI)

Google Gemini API Key (Get one here)

1. Clone the Repository

git clone [https://github.com/yourusername/doc-intel-hub.git](https://github.com/yourusername/doc-intel-hub.git)
cd doc-intel-hub


2. Backend Setup

Navigate to the server folder, install dependencies, and configure environment variables.

cd server
npm install


Create a .env file in the server directory:

PORT=5000
MONGO_URI=mongodb://localhost:27017/doc_intel_hub
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key


Start the server:

node server.js
# Output: 🚀 Server running on port 5000


3. Frontend Setup

Open a new terminal, navigate to the client folder, and install dependencies.

cd ../client
npm install


Start the React development server:

npm run dev
# Output: ➜  Local:   http://localhost:5173/


📖 Usage Guide

Register/Login: Create an account to access your private dashboard.

Upload: Click the "Upload PDF/TXT/DOCX" button in the sidebar.

Select a Document: Click on a file in the sidebar list.

PDFs: Will render in the PDF viewer.

DOCX/TXT: Will render as extracted text.

Chat: Type your question in the chat box on the right. The AI will analyze the specific document selected and provide an answer.

📂 Project Structure

doc-intel-hub/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/          # Login, Register, Profile
│   │   ├── App.jsx         # Main Dashboard Logic
│   │   └── main.jsx        # Entry point
│   └── ...
├── server/                 # Express Backend
│   ├── models/             # Mongoose Schemas (User, Document, Chat)
│   ├── uploads/            # Local storage for uploaded files
│   ├── server.js           # Main server logic & routes
│   └── ...
└── README.md


🔒 Security Note

This project stores uploaded files locally in the server/uploads directory.

Ensure .env files are added
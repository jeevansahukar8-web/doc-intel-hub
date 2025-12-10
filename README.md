# DocuMind – AI Document Intelligence Hub

DocuMind is a modern web application that allows users to upload documents (PDF, DOCX, TXT) and intelligently interact with them using an AI-powered chat interface. Powered by **Google Gemini 2.5 Flash**, DocuMind provides instant, accurate answers strictly based on the contents of uploaded files.

---

## 🚀 Features

- **Multi‑Format Support:** Upload and process **PDF**, **DOCX**, and **TXT** files.
- **AI Chat Interface:** Ask questions and get context‑aware answers using Gemini.
- **Document Preview:**
  - Built‑in PDF viewer.
  - Rendered text preview for DOCX and TXT.
- **User Authentication:** Secure login & registration with **JWT**.
- **Chat + Document Persistence:** All user data is stored in **MongoDB**.
- **Responsive UI:** Clean dark‑themed interface built with **React + Tailwind CSS**.

---

## 🛠️ Tech Stack

### **Frontend**
- React 19 (Vite)
- Tailwind CSS
- Lucide React Icons
- React Router DOM
- React Markdown

### **Backend**
- Node.js + Express
- MongoDB & Mongoose
- Google Generative AI SDK (Gemini 2.5 Flash)
- Multer (File Uploads)
- Mammoth.js (DOCX parsing)
- Bcrypt + JWT (Auth)

---

## ⚙️ Installation & Setup

### 1. Prerequisites

#### 🪟 **Windows**
- Install **Node.js** (LTS) from nodejs.org
- Install **MongoDB Community Server** (or use **MongoDB Atlas**)
- Install **Git**

#### 🍎 **macOS**
```sh
brew install node
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```
Git is usually preinstalled.

#### 🐧 **Linux (Ubuntu/Debian)**
```sh
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```
Install MongoDB following official docs.

---

## 2. Get Your API Key

Get a free Google Gemini API key:
**https://aistudio.google.com/app/apikey**

---

## 3. Project Setup

Clone the repository:
```sh
git clone https://github.com/jeevansahukar8-web/doc-intel-hub
cd doc-intel-hub
```

### Backend Setup
```sh
cd server
npm install
```

Create **.env** inside `/server`:
```env
PORT=5000

# Local MongoDB
MONGO_URI=mongodb://localhost:27017/doc_intel_hub
# OR your Atlas URI

JWT_SECRET=your_super_secure_random_string
GEMINI_API_KEY=your_google_api_key_here
```

### Frontend Setup
```sh
cd ../client
npm install
```

---

## 4. Running the Application

### Terminal 1 — Start Backend
```sh
cd server
node server.js
```
Expected output:
```
🚀 Server running on port 5000
✅ MongoDB Connected
```

### Terminal 2 — Start Frontend
```sh
cd client
npm run dev
```
Expected output:
```
➜ Local: http://localhost:5173/
```

---

## 5. Access the App
Open: **http://localhost:5173/**

---

## 📖 Usage Guide
1. **Register/Login** to access your dashboard.
2. **Upload** a PDF/DOCX/TXT file.
3. **Select** a document:
   - PDFs open in a PDF viewer.
   - TXT/DOCX render as plain extracted text.
4. **Ask questions** in the chat panel — AI responds based on the selected document.

---

## 📂 Project Structure
```
doc-intel-hub/
├── client/                # React Frontend
│   ├── src/
│   │   ├── pages/         # Login, Register, Dashboard
│   │   ├── App.jsx        # Main layout & routes
│   │   └── main.jsx       # Entry point
├── server/                # Express Backend
│   ├── models/            # Mongoose models (User, Document, Chat)
│   ├── uploads/           # Stored uploaded files
│   ├── server.js          # Main Express server
└── README.md
```

---

## 🔒 Security Notes
- Uploaded files are stored locally in `server/uploads`.
- Never push `.env` to GitHub — it contains your API keys.
- JWT tokens are securely hashed and validated on every request.

---

## ⭐ Contributing
Pull requests are welcome! Feel free to open issues for bugs or enhancements.

---

## 📜 License
This project is licensed under the **MIT License**.

---

**Developed with ❤️ by Jeevan Sahukar**


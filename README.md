# **DocuMind \- AI Document Intelligence Hub**

DocuMind is a modern web application that allows users to upload documents (PDF, DOCX, TXT) and interact with them using an intelligent AI chat interface. Powered by Google's **Gemini 2.5 Flash** model, it provides instant answers based strictly on the content of your uploaded files.

## **🚀 Features**

* **Multi-Format Support:** Upload and process **PDF**, **Word (.docx)**, and **Text (.txt)** files.  
* **AI Chat:** Ask questions about your documents and get accurate, context-aware answers using Gemini 2.5 Flash.  
* **Document Preview:**  
  * Integrated PDF viewer.  
  * Raw text preview for .txt and .docx files.  
* **User Authentication:** Secure JWT-based Login and Registration system.  
* **Persistent Storage:** Chat history and documents are saved to MongoDB.  
* **Responsive Design:** A beautiful, dark-themed UI built with React and Tailwind CSS.

## **🛠️ Tech Stack**

### **Frontend**

* **React 19** (Vite)  
* **Tailwind CSS** (Styling)  
* **Lucide React** (Icons)  
* **React Router DOM** (Navigation)  
* **React Markdown** (Rendering AI responses)

### **Backend**

* **Node.js & Express**  
* **MongoDB** (Database) & **Mongoose**  
* **Google Generative AI SDK** (Gemini API)  
* **Multer** (File Uploads)  
* **Mammoth** (DOCX text extraction)  
* **Bcrypt** & **JWT** (Auth)

## **⚙️ Installation & Setup**

### **1\. Prerequisites**

Before you begin, ensure you have the following installed on your operating system:

#### **🪟 Windows**

1. **Node.js:** Download and install the LTS version from [nodejs.org](https://nodejs.org/).  
2. **MongoDB:**  
   * **Option A (Local):** Download **MongoDB Community Server** from [mongodb.com](https://www.mongodb.com/try/download/community) and install it. *Note: Select "Install MongoDB as a Service" during installation.*  
   * **Option B (Cloud):** Create a free account on [MongoDB Atlas](https://www.mongodb.com/atlas) and get your connection string.  
3. **Git:** Download and install from [git-scm.com](https://git-scm.com/).

#### **🍎 macOS**

1. **Node.js:** Install via Homebrew (recommended) or download the installer.  
   brew install node

2. **MongoDB:**  
   brew tap mongodb/brew  
   brew install mongodb-community  
   brew services start mongodb-community

3. **Git:** Usually pre-installed. If not: brew install git.

#### **🐧 Linux (Ubuntu/Debian)**

1. **Node.js:**  
   curl \-fsSL \[https://deb.nodesource.com/setup\_lts.x\](https://deb.nodesource.com/setup\_lts.x) | sudo \-E bash \-  
   sudo apt-get install \-y nodejs

2. **MongoDB:** Follow the [official installation guide](https://www.google.com/search?q=https://www.mongodb.com/docs/manual/administration/install-on-linux/) for your distro.  
   * Start the service: sudo systemctl start mongod

### **2\. Get your API Key**

You need a Google Gemini API Key to power the AI features.

* Get it for free here: [Google AI Studio](https://aistudio.google.com/app/apikey)

### **3\. Project Setup (All Platforms)**

Open your terminal (Command Prompt, PowerShell, or Terminal) and follow these steps:

#### **Step 1: Clone the Repository**

git clone \[https://github.com/yourusername/doc-intel-hub.git\](https://github.com/yourusername/doc-intel-hub.git)  
cd doc-intel-hub

#### **Step 2: Backend Configuration**

1. Navigate to the server folder:  
   cd server

2. Install dependencies:  
   npm install

3. **Create the Environment File:**  
   * Create a file named .env inside the server folder.  
   * Add the following content (replace the placeholders):

PORT=5000

\# Use this for local MongoDB:  
MONGO\_URI=mongodb://localhost:27017/doc\_intel\_hub  
\# OR use your Atlas Connection String if using Cloud

JWT\_SECRET=your\_super\_secure\_random\_string  
GEMINI\_API\_KEY=paste\_your\_google\_api\_key\_here

#### **Step 3: Frontend Configuration**

1. Open a **new** terminal window/tab.  
2. Navigate to the client folder (from the project root):  
   cd client

3. Install dependencies:  
   npm install

### **4\. Running the Application**

To run the app, you need to keep **two terminals** open: one for the backend and one for the frontend.

#### **Terminal 1: Start Backend (Server)**

Make sure you are inside the server directory.

node server.js

* **Success Output:** 🚀 Server running on port 5000 and ✅ MongoDB Connected

#### **Terminal 2: Start Frontend (Client)**

Make sure you are inside the client directory.

npm run dev

* **Success Output:** ➜ Local: http://localhost:5173/

### **5\. Access the App**

Open your browser and visit: [**http://localhost:5173**](https://www.google.com/search?q=http://localhost:5173)

## **📖 Usage Guide**

1. **Register/Login:** Create an account to access your private dashboard.  
2. **Upload:** Click the "Upload PDF/TXT/DOCX" button in the sidebar.  
3. **Select a Document:** Click on a file in the sidebar list.  
   * **PDFs:** Will render in the PDF viewer.  
   * **DOCX/TXT:** Will render as extracted text.  
4. **Chat:** Type your question in the chat box on the right. The AI will analyze the specific document selected and provide an answer.

## **📂 Project Structure**

doc-intel-hub/  
├── client/                 \# React Frontend  
│   ├── src/  
│   │   ├── pages/          \# Login, Register, Profile  
│   │   ├── App.jsx         \# Main Dashboard Logic  
│   │   └── main.jsx        \# Entry point  
│   └── ...  
├── server/                 \# Express Backend  
│   ├── models/             \# Mongoose Schemas (User, Document, Chat)  
│   ├── uploads/            \# Local storage for uploaded files  
│   ├── server.js           \# Main server logic & routes  
│   └── ...  
└── README.md

## **🔒 Security Note**

* This project stores uploaded files locally in the server/uploads directory.  
* Ensure .env files are included in your .gitignore to protect your API keys.
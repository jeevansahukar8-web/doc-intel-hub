import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, MessageSquare, Send, Loader2, 
  Trash2, Plus, Bot, Menu, UserCircle, LogOut, X, CheckCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

// --- UPDATED CONFIGURATION ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = `${API_URL}/api`;
const getFileUrl = (filename) => `${API_URL}/uploads/${filename}`;
// -----------------------------

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchDocuments();
  }, [token, navigate]);

  useEffect(() => {
    if (selectedDoc) {
      const isPdf = selectedDoc.filename.toLowerCase().endsWith('.pdf');
      
      if (!isPdf) {
        setFileContent("Loading preview...");
        fetch(`${API_BASE}/doc-content/${selectedDoc._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => {
            if (!res.ok) throw new Error("Failed to load");
            return res.text();
          })
          .then(text => setFileContent(text))
          .catch(err => setFileContent("Preview not available for this file type."));
      } else {
        setFileContent('');
      }
      
      fetchChatHistory(selectedDoc._id);
    } else {
      setChatHistory([]);
      setFileContent('');
    }
  }, [selectedDoc, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) { localStorage.clear(); navigate('/'); return; }
      const data = await res.json();
      setDocuments(data);
    } catch (err) { console.error("Failed to load docs", err); }
  };

  const fetchChatHistory = async (docId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { const data = await res.json(); setChatHistory(data); }
    } catch (err) { console.error("Failed to fetch chat history", err); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/upload`, { 
        method: 'POST', 
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if(!res.ok) throw new Error('Upload Failed');
      fetchDocuments();
      alert('Document uploaded successfully!');
    } catch (err) { alert('Upload failed. Ensure file is PDF, DOCX, or TXT.'); } 
    finally { setUploading(false); }
  };

  const handleDelete = async (e, docId) => {
    e.stopPropagation(); 
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`${API_BASE}/documents/${docId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDocuments(prev => prev.filter(d => d._id !== docId));
      if (selectedDoc?._id === docId) { setSelectedDoc(null); setChatHistory([]); }
    } catch (err) { alert("Failed to delete."); }
  };

  const handleAsk = async () => {
    if (!query.trim() || !selectedDoc) return;
    const userMsg = { role: 'user', content: query };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ docId: selectedDoc._id, question: userMsg.content })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "⚠️ Error processing request." }]);
    } finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-transparent">
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0'} glass-panel absolute md:relative z-30 h-full flex flex-col transition-all duration-300 ease-out border-r-0 md:border-r border-white/20`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">DocuMind</h1>
              <p className="text-xs text-blue-200">AI Workspace</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/70"><X size={20}/></button>
        </div>

        <div className="p-4 space-y-3">
           <Link to="/profile" className="flex items-center w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-blue-100">
            <UserCircle className="mr-3" size={20} />
            <span className="text-sm font-medium">My Profile</span>
          </Link>

          <label className="flex items-center justify-center w-full p-3 rounded-xl border border-dashed border-white/30 hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all group">
            {uploading ? <Loader2 className="animate-spin text-blue-400 mr-2" /> : <Plus className="text-blue-300 group-hover:text-blue-400 mr-2" size={18} />}
            <span className="text-sm font-medium text-gray-300 group-hover:text-white">{uploading ? "Uploading..." : "Upload PDF/TXT/DOCX"}</span>
            <input type="file" className="hidden" accept=".pdf,.txt,.docx" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-1">Your Library</div>
          {documents.map(doc => (
            <div
              key={doc._id}
              onClick={() => { setSelectedDoc(doc); if(window.innerWidth < 768) setSidebarOpen(false); }}
              className={`group w-full p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer border ${
                selectedDoc?._id === doc._id 
                ? 'bg-blue-600/90 border-blue-500 shadow-lg shadow-blue-900/50 text-white' 
                : 'bg-transparent border-transparent hover:bg-white/5 text-gray-300 hover:text-white'
              }`}
            >
              <FileText size={18} className={selectedDoc?._id === doc._id ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'} />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{doc.originalName || doc.filename}</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-green-400/80">
                  <CheckCircle size={10} /> Processed
                </div>
              </div>
              <button 
                onClick={(e) => handleDelete(e, doc._id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-white w-full px-3 py-2 rounded-xl hover:bg-white/5 transition-all">
                <LogOut size={18} /> <span className="text-sm font-medium">Log Out</span>
            </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col h-full relative glass-panel m-0 md:m-4 md:rounded-2xl border-none md:border overflow-hidden">
        
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
              <Menu size={20} />
            </button>
            <h2 className="font-semibold text-white truncate max-w-md text-lg">
              {selectedDoc ? selectedDoc.originalName : 'Select a document'}
            </h2>
          </div>
          {selectedDoc && (
            <span className="hidden sm:flex px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-full items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Active
            </span>
          )}
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {selectedDoc ? (
            <>
              {/* FILE PREVIEW */}
              <div className="hidden md:block w-1/2 bg-slate-900 border-r border-white/10 flex flex-col">
                {selectedDoc.filename.toLowerCase().endsWith('.pdf') ? (
                   <iframe src={getFileUrl(selectedDoc.filename)} className="w-full h-full" title="PDF Viewer" />
                ) : (
                   <div className="w-full h-full overflow-auto p-8 bg-white/5 text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                     {fileContent || "Loading content..."}
                   </div>
                )}
              </div>

              {/* CHAT INTERFACE */}
              <div className="w-full md:w-1/2 flex flex-col bg-slate-900/50 backdrop-blur-sm">
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 animate-fade-in">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <MessageSquare className="text-blue-400 w-8 h-8" />
                      </div>
                      <p className="text-sm font-medium">Ask specific questions about this document.</p>
                    </div>
                  )}
                  
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                      <div className={`max-w-[90%] md:max-w-[85%] p-4 rounded-2xl shadow-lg backdrop-blur-md border ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-sm border-blue-500' 
                        : 'bg-white/10 text-gray-100 rounded-bl-sm border-white/10'
                      }`}>
                        <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert text-white' : 'prose-invert text-gray-100'}`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-xs text-gray-400 font-medium">Analyzing document...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
                  <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl p-1.5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                    <input 
                      type="text" 
                      value={query} 
                      onChange={(e) => setQuery(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && handleAsk()} 
                      placeholder="Ask any question..." 
                      className="flex-1 bg-transparent px-4 py-2.5 focus:outline-none text-sm text-white placeholder-gray-500" 
                      disabled={loading} 
                    />
                    <button 
                      onClick={handleAsk} 
                      disabled={loading || !query.trim()} 
                      className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mt-6 mb-2">Welcome, {username}</h3>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Select a document from the library or upload a new PDF/Text/Docx file to harness the power of AI analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Routes
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;
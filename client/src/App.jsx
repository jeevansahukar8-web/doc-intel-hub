import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, MessageSquare, Send, Loader2, 
  Trash2, Plus, Bot, Menu, UserCircle, LogOut
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

const API_BASE = 'http://localhost:5000/api';
const getFileUrl = (filename) => `http://localhost:5000/uploads/${filename}`;

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  // Load documents on mount
  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchDocuments();
  }, [token, navigate]);

  // Load Chat History when selectedDoc changes
  useEffect(() => {
    if (selectedDoc) {
      fetchChatHistory(selectedDoc._id);
    } else {
      setChatHistory([]);
    }
  }, [selectedDoc]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        navigate('/');
        return;
      }
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load docs", err);
    }
  };

  const fetchChatHistory = async (docId) => {
    // Optional: add a small loading state for history fetching if desired
    try {
      const res = await fetch(`${API_BASE}/chat/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await fetch(`${API_BASE}/upload`, { 
        method: 'POST', 
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      fetchDocuments();
      alert('Document uploaded!');
    } catch (err) {
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e, docId) => {
    e.stopPropagation(); 
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await fetch(`${API_BASE}/documents/${docId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setDocuments(prev => prev.filter(d => d._id !== docId));
      
      if (selectedDoc?._id === docId) {
        setSelectedDoc(null);
        setChatHistory([]);
      }
    } catch (err) {
      alert("Failed to delete.");
    }
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
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-gray-900 text-white transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg"><Bot size={24} className="text-white" /></div>
          <div><h1 className="font-bold text-lg tracking-wide">DocuMind</h1><p className="text-xs text-gray-400">Welcome, {username}</p></div>
        </div>

        {/* Navigation & Upload */}
        <div className="p-4 space-y-3">
           <Link to="/profile" className="flex items-center w-full p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
            <UserCircle className="text-blue-400 mr-2" size={18} />
            <span className="text-sm font-medium">My Profile</span>
          </Link>

          <label className="flex items-center justify-center w-full p-3 rounded-xl border border-gray-700 hover:border-blue-500 hover:bg-gray-800 cursor-pointer transition-all group">
            {uploading ? <Loader2 className="animate-spin text-blue-400 mr-2" /> : <Plus className="text-gray-400 group-hover:text-blue-400 mr-2" size={18} />}
            <span className="text-sm font-medium text-gray-300 group-hover:text-white">{uploading ? "Uploading..." : "New PDF Upload"}</span>
            <input type="file" className="hidden" accept=".pdf" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Library</div>
          {documents.map(doc => (
            <div
              key={doc._id}
              onClick={() => { setSelectedDoc(doc); }}
              className={`group w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
                selectedDoc?._id === doc._id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <FileText size={16} className="shrink-0" />
              <div className="truncate text-sm flex-1">{doc.originalName || doc.filename}</div>
              <button 
                onClick={(e) => handleDelete(e, doc._id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                title="Delete Document"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                <LogOut size={16} /> <span className="text-sm">Log Out</span>
            </button>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Menu size={20} /></button>
            <h2 className="font-semibold text-gray-800 truncate max-w-md">{selectedDoc ? selectedDoc.originalName : 'Select a document to chat'}</h2>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {selectedDoc ? (
            <>
              {/* PDF VIEWER */}
              <div className="w-1/2 bg-gray-200 border-r border-gray-300 hidden md:block">
                <iframe src={getFileUrl(selectedDoc.filename)} className="w-full h-full" title="PDF Viewer" />
              </div>
              {/* CHAT INTERFACE */}
              <div className="w-full md:w-1/2 flex flex-col bg-white">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center"><MessageSquare className="text-blue-500 w-8 h-8" /></div>
                      <p className="text-sm font-medium">Ask questions about this PDF</p>
                    </div>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {loading && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin text-blue-600" /><span className="text-xs text-gray-500 font-medium">Thinking...</span></div></div>}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAsk()} placeholder="Ask any question..." className="flex-1 bg-transparent px-3 py-2 focus:outline-none text-sm text-gray-700" disabled={loading} />
                    <button onClick={handleAsk} disabled={loading || !query.trim()} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"><Send size={18} /></button>
                  </div>
                </div>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-8">
              <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6"><FileText className="w-10 h-10 text-blue-500" /></div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {username}</h3>
              <p className="text-gray-500 max-w-md">Select a document from the sidebar or upload a new one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ROUTING SETUP
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
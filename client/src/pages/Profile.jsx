import React, { useState, useEffect } from 'react';
import { FileText, Trash2, ArrowLeft, User, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile() {
  const [documents, setDocuments] = useState([]);
  const username = localStorage.getItem('username');
  const email = localStorage.getItem('email');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if(!token) navigate('/');
    fetchDocuments();
  }, [token, navigate]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) { console.error("Failed to load docs", err); }
  };

  const handleDelete = async (docId) => {
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDocuments(prev => prev.filter(d => d._id !== docId));
    } catch (err) { alert("Failed to delete."); }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto animate-fade-in">
        <Link to="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors group">
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
        
        {/* Profile Card */}
        <div className="glass-panel p-8 rounded-3xl mb-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-50"></div>
          
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/20 relative z-10">
            <User size={48} />
          </div>
          <div className="text-center md:text-left relative z-10 flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">{username}</h1>
            <p className="text-blue-200 font-medium">{email}</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate('/'); }}
            className="relative z-10 px-6 py-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-gray-300 hover:text-red-400 rounded-xl transition-all"
          >
            Log Out
          </button>
        </div>

        {/* File Manager */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">My Documents <span className="text-gray-500 text-sm font-normal ml-2">({documents.length})</span></h2>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          {documents.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-5 font-semibold">Document Name</th>
                    <th className="p-5 font-semibold">Upload Date</th>
                    <th className="p-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map(doc => (
                    <tr key={doc._id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <FileText size={20} />
                          </div>
                          <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{doc.originalName || doc.filename}</span>
                        </div>
                      </td>
                      <td className="p-5 text-gray-400 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => handleDelete(doc._id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
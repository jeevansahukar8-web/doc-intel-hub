import React, { useState, useEffect } from 'react';
import { FileText, Trash2, ArrowLeft, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
      const res = await fetch('http://localhost:5000/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load docs", err);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`http://localhost:5000/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDocuments(prev => prev.filter(d => d._id !== docId));
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
        </Link>
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8 flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{username}</h1>
            <p className="text-gray-500">{email}</p>
            <button 
              onClick={() => { localStorage.clear(); navigate('/'); }}
              className="mt-3 text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* File Manager Section */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Documents ({documents.length})</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No documents uploaded yet.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Date Uploaded</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map(doc => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center gap-3 text-gray-700 font-medium">
                      <FileText size={18} className="text-blue-500" />
                      {doc.originalName || doc.filename}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(doc._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
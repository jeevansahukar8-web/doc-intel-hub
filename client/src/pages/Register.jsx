import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Loader2, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (res.ok) {
        alert('Registration successful! Please login.');
        navigate('/');
      } else {
        const data = await res.json();
        alert(data.error || 'Registration failed');
      }
    } catch (err) { alert('Error connecting to server'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-10 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-lg">
            <Sparkles className="text-pink-400 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Join DocuMind</h1>
          <p className="text-gray-400 mt-2 text-sm">Start your AI research journey</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-pink-400 transition-colors" size={18} />
              <input type="text" required className="w-full glass-input pl-10 pr-4 py-3 rounded-xl outline-none" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-pink-400 transition-colors" size={18} />
              <input type="email" required className="w-full glass-input pl-10 pr-4 py-3 rounded-xl outline-none" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-pink-400 transition-colors" size={18} />
              <input type="password" required className="w-full glass-input pl-10 pr-4 py-3 rounded-xl outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <button disabled={loading} className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-500/20 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex justify-center mt-4">
             {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
          </button>
        </form>
        <p className="mt-8 text-center text-gray-400 text-sm relative z-10">
          Already have an account? <Link to="/" className="text-pink-400 font-semibold hover:text-pink-300 transition-colors">Login</Link>
        </p>
      </div>
    </div>
  );
}
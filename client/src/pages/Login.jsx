import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, Zap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        navigate('/dashboard');
      } else { alert(data.error); }
    } catch (err) { alert('Login failed'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Glass Card */}
      <div className="glass-panel p-10 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        
        {/* Decorative background blurs inside card */}
        <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-purple-500/30 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-lg">
            <Zap className="text-blue-400 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 mt-2 text-sm">Enter your credentials to access your workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="email" 
                required 
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl outline-none" 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="password" 
                required 
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl outline-none" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>
          <button disabled={loading} className="w-full glass-button font-bold py-3.5 rounded-xl flex justify-center items-center mt-2">
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm relative z-10">
          Don't have an account? <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Create one</Link>
        </p>
      </div>
    </div>
  );
}
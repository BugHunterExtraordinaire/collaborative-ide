import { useState } from 'react';
import axios from 'axios';

import { type LoginFormProps } from '../../types/interfaces';

export default function LoginForm({ backendPort, onSuccess, onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`http://localhost:${backendPort}/api/auth/login`, { email, password });
      onSuccess(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="text-red-500 mb-2 text-sm text-center bg-red-500/10 p-2 rounded">{error}</div>}
      
      <input
        type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}
        className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <input
        type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
        className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
      />
      
      <button type="submit" className="p-3 mt-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded cursor-pointer font-bold">
        Log In
      </button>
      
      <p className="text-center mt-4 text-sm text-zinc-400">
        Need an account?{' '}
        <span className="text-blue-500 hover:text-blue-400 cursor-pointer font-semibold" onClick={onToggleMode}>
          Sign Up
        </span>
      </p>
    </form>
  );
}
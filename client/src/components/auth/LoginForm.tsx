import axios from 'axios';
import toast from 'react-hot-toast'

import { useState } from 'react';

import { type AuthenticationProps } from '../../types/interfaces';

export default function LoginForm({ onSuccess, onToggleMode }: AuthenticationProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit: React.SubmitEventHandler = async (e) => {
    e.preventDefault();
    toast.promise(axios.post("/auth/login", { email, password }), {
      loading: "Logging in...",
      success: (res) => {
        onSuccess(res.data.user);
        return `${res.data.message}, Welcome ${res.data.user.username}`;
      },
      error: (err) => `${err?.response?.data?.message || "Error while connecting to server"}`
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      
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
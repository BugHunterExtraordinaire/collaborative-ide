import axios from 'axios';

import { useState } from 'react';

import { type AuthenticationProps } from '../../types/interfaces';

export default function RegisterForm({ backendPort, onSuccess, onToggleMode }: AuthenticationProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');

  const handleSubmit: React.SubmitEventHandler = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`http://localhost:${backendPort}/api/auth/register`, { username, email, password, role });
      const loginRes = await axios.post(`http://localhost:${backendPort}/api/auth/login`, { email, password });
      onSuccess(loginRes.data.user);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Registration failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="text-red-500 mb-2 text-sm text-center bg-red-500/10 p-2 rounded">{error}</div>}
      
      <input
        type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)}
        className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <input
        type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}
        className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <input
        type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
        className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
      />
      
      <select
        value={role} onChange={(e) => setRole(e.target.value)}
        className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
      >
        <option value="Student">I am a Student</option>
        <option value="Instructor">I am an Instructor</option>
      </select>
      
      <button type="submit" className="p-3 mt-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded cursor-pointer font-bold">
        Register
      </button>
      
      <p className="text-center mt-4 text-sm text-zinc-400">
        Already have an account?{' '}
        <span className="text-blue-500 hover:text-blue-400 cursor-pointer font-semibold" onClick={onToggleMode}>
          Log In
        </span>
      </p>
    </form>
  );
}
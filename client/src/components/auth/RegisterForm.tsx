import toast from 'react-hot-toast';
import axios from 'axios';

import { useState } from 'react';

import { type AuthenticationProps } from '../../types/interfaces';

export default function RegisterForm({ onSuccess, onToggleMode }: AuthenticationProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');

  const handleSubmit: React.SubmitEventHandler = async (e) => {
    e.preventDefault();
    toast.promise(async () => {
      await axios.post("http://localhost:80/api/v1/auth/register", { username, email, password, role });
      const loginRes = await axios.post("http://localhost:80/api/v1/auth/login", { email, password });
      onSuccess(loginRes.data.user)
    }
      , {
        loading: "Registering...",
        success: <b>Registration Successful, Logging you in now!</b>,
        error: (err) => <b>{err.response.data.message}</b>
      }
    )
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

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
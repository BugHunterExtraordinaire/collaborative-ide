import { useState } from 'react';
import axios from 'axios';
import { type LoginProps } from '../types/interfaces';

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');

  const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');

try {
      if (isRegistering) {
        await axios.post(`http://localhost:${backendPort}/api/auth/register`, {
          username, email, password, role
        });
      }
      const loginRes = await axios.post(`http://localhost:${backendPort}/api/auth/login`, { email, password });
      
      onLoginSuccess(loginRes.data.user); 
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Authentication failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black text-white font-sans">
      <div className="bg-zinc-900 p-10 rounded-xl w-100 border border-zinc-800 shadow-2xl">
        <h2 className="mt-0 text-2xl font-bold text-center mb-6">
          {isRegistering ? 'Create Account' : 'Collab-IDE Login'}
        </h2>
        
        {error && <div className="text-red-500 mb-4 text-sm text-center bg-red-500/10 p-2 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegistering && (
            <input 
              type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}
          <input 
            type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input 
            type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          
          {isRegistering && (
            <select 
              value={role} onChange={(e) => setRole(e.target.value)}
              className="p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="Student">I am a Student</option>
              <option value="Instructor">I am an Instructor</option>
            </select>
          )}

          <button type="submit" className="p-3 mt-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded cursor-pointer font-bold">
            {isRegistering ? 'Register' : 'Log In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-400">
          {isRegistering ? 'Already have an account? ' : 'Need an account? '}
          <span className="text-blue-500 hover:text-blue-400 cursor-pointer font-semibold" onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
            {isRegistering ? 'Log In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
}
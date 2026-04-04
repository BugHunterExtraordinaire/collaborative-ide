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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        await axios.post('http://localhost:4000/api/auth/register', {
          username, email, password, role
        });
        const loginRes = await axios.post('http://localhost:4000/api/auth/login', { email, password });
        onLoginSuccess(loginRes.data.user, loginRes.data.token);
      } else {
        const loginRes = await axios.post('http://localhost:4000/api/auth/login', { email, password });
        onLoginSuccess(loginRes.data.user, loginRes.data.token);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Authentication failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#fff' }}>
      <div style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '8px', width: '350px', border: '1px solid #333' }}>
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>
          {isRegistering ? 'Create Account' : 'Collab-IDE Login'}
        </h2>
        
        {error && <div style={{ color: '#ff5555', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {isRegistering && (
            <input 
              type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
            />
          )}
          <input 
            type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
          />
          <input 
            type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
          />
          
          {isRegistering && (
            <select 
              value={role} onChange={(e) => setRole(e.target.value as string)}
              style={{ padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
              <option value="Student">I am a Student</option>
              <option value="Instructor">I am an Instructor</option>
            </select>
          )}

          <button type="submit" style={{ padding: '12px', backgroundColor: '#007acc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRegistering ? 'Register' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
          {isRegistering ? 'Already have an account? ' : 'Need an account? '}
          <span style={{ color: '#007acc', cursor: 'pointer' }} onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
            {isRegistering ? 'Log In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
}
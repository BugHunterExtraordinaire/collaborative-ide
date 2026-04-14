import { useState, useEffect } from 'react';
import axios from 'axios';
import { type DashboardProps } from '../types/interfaces';
import { type SessionsArray } from '../types/arrays';

export default function Dashboard({ user, onJoinRoom, onLogout }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionsArray>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinId, setJoinId] = useState('');

  const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
  
  useEffect(() => {
    axios.get(`http://localhost:${backendPort}/api/sessions`)
      .then(res => setSessions(res.data))
      .catch(err => console.error('Failed to load sessions', err));
  }, [backendPort]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:${backendPort}/api/sessions`, {
        name: newRoomName
      });
      onJoinRoom(res.data.session_id);
    } catch (error) {
      console.error('Failed to create session', error);
    }
  };

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      onJoinRoom(joinId.trim());
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h2>Welcome, {user.username} <span style={{ fontSize: '14px', color: '#4caf50' }}>({user.role})</span></h2>
        <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
          
          <h3 style={{ marginTop: 0, color: '#007acc' }}>Create New Session</h3>
          <form onSubmit={handleCreateSession} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input 
              type="text" placeholder="e.g., CS101 Lab 3" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required
              style={{ flexGrow: 1, padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
            />
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007acc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
          </form>

          <h3 style={{ marginTop: 0, color: '#ff9800' }}>Join with Code</h3>
          <form onSubmit={handleJoinExisting} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" placeholder="Paste 8-character Room ID" value={joinId} onChange={(e) => setJoinId(e.target.value)} required
              style={{ flexGrow: 1, padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
            />
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Join</button>
          </form>
          
        </div>
        
        {user.role === 'Instructor' && (
          <div style={{ flex: 1, backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0 }}>Active Global Sessions</h3>
            {sessions.length === 0 ? (
              <p style={{ color: '#888' }}>No active sessions.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessions.map(session => (
                  <li key={session.session_id} style={{ padding: '10px', backgroundColor: '#252526', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{session.name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>ID: {session.session_id}</div>
                    </div>
                    <button onClick={() => onJoinRoom(session.session_id)} style={{ padding: '6px 12px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
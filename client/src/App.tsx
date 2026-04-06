import { useState, useEffect } from 'react';
import axios from 'axios';
import CollaborativeEditor from './components/CollaborativeEditor';
import Login from './components/Login';
import Chat from './components/Chat';
import Editor from '@monaco-editor/react';
import type { UserObject } from './types/interfaces';

export default function App() {
  const [user, setUser] = useState<UserObject | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('System Ready. Awaiting execution...');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [language, setLanguage] = useState('javascript');

  // --- NEW: Playback State (FR-09) ---
  const [history, setHistory] = useState<{ time: string; code: string }[]>([]);
  const [isPlaybackMode, setIsPlaybackMode] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);

  const sessionId = 'test-room-1'; 

  // Check login state
  useEffect(() => {
    const savedToken = sessionStorage.getItem('ide_token');
    const savedUser = sessionStorage.getItem('ide_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // --- NEW: Debounced History Capture ---
  // Saves a snapshot of the code every 1 second of typing to prevent memory bloat
  useEffect(() => {
    if (!code) return;

    const timer = setTimeout(() => {
      setHistory((prev) => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry?.code === code) return prev; // Don't save identical duplicates
        return [...prev, { time: new Date().toLocaleTimeString(), code }];
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [code]);
  // --------------------------------------

  const handleLoginSuccess = (userData: UserObject, jwt: string) => {
    setUser(userData);
    setToken(jwt);
    sessionStorage.setItem('ide_token', jwt);
    sessionStorage.setItem('ide_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('ide_token');
    sessionStorage.removeItem('ide_user');
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Spawning isolated container...\nExecuting...');
    try {
      const response = await axios.post('http://localhost:5000/execute', { code, language });
      setOutput(response.data.output || 'Execution successful (No output)');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) setOutput(error.response?.data?.message || 'Error');
    } finally {
      setIsRunning(false);
    }
  };

  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Left Panel: Code & Playback */}
      <div style={{ width: '60%', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', backgroundColor: '#252526', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Collab-IDE ({sessionId})</h3>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as string)}
              style={{ padding: '4px', backgroundColor: '#333', color: '#fff', border: 'none' }}
              disabled={isPlaybackMode}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* NEW: Playback Toggle Button */}
            <button 
              onClick={() => {
                setIsPlaybackMode(!isPlaybackMode);
                setPlaybackIndex(Math.max(0, history.length - 1)); // Start at the newest code
              }}
              style={{ padding: '4px 10px', backgroundColor: isPlaybackMode ? '#ff9800' : '#4caf50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isPlaybackMode ? 'Exit Playback' : '⏪ Playback Mode'}
            </button>
            <span style={{ color: '#4caf50', fontSize: '12px' }}>{user.username} ({user.role})</span>
            <button onClick={handleLogout} style={{ padding: '4px 8px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        {/* NEW: The Scrubber UI */}
        {isPlaybackMode && history.length > 0 && (
          <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333' }}>
            <input 
              type="range" 
              min="0" 
              max={history.length - 1} 
              value={playbackIndex} 
              onChange={(e) => setPlaybackIndex(Number(e.target.value))} 
              style={{ width: '100%', cursor: 'pointer' }} 
            />
            <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '8px', color: '#aaa' }}>
              Viewing Snapshot: <strong style={{ color: '#fff' }}>{history[playbackIndex].time}</strong>
            </div>
          </div>
        )}
        
        <div style={{ flexGrow: 1 }}>
          {/* THE ENGINE: Swap editors safely based on mode */}
          {isPlaybackMode ? (
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={history.length > 0 ? history[playbackIndex].code : 'No history recorded yet.'}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
            />
          ) : (
            <CollaborativeEditor 
              sessionId={sessionId} 
              language={language}
              currentUser={user}
              onCodeChange={setCode} 
            />
          )}
        </div>
      </div>

      {/* Right Panel: Output & Chat */}
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
        <div style={{ height: '50%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Terminal Output</h3>
            <button onClick={handleRunCode} disabled={isRunning || isPlaybackMode} style={{ padding: '6px 16px', backgroundColor: isRunning ? '#555' : '#007acc', color: '#fff', border: 'none', cursor: isRunning ? 'wait' : 'pointer', fontWeight: 'bold' }}>
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
          <pre style={{ padding: '15px', margin: 0, flexGrow: 1, overflowY: 'auto', color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>{output}</pre>
        </div>
        <div style={{ height: '50%', display: 'flex', flexDirection: 'column' }}>
          <Chat sessionId={sessionId} username={user.username} />
        </div>
      </div>

    </div>
  );
}
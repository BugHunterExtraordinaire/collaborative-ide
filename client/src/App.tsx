import { useState, useEffect } from 'react';
import { type UserObject } from './types/interfaces';
import axios from 'axios';
import CollaborativeEditor from './components/CollaborativeEditor';
import Login from './components/Login';
import Chat from './components/Chat';

export default function App() {
  const [user, setUser] = useState<UserObject | null>();
  const [token, setToken] = useState<string | null>(null);
  
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('System Ready. Awaiting execution...');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [language, setLanguage] = useState('javascript');

  const sessionId = 'test-room-1'; 

  useEffect(() => {
    const savedToken = localStorage.getItem('ide_token');
    const savedUser = localStorage.getItem('ide_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData: UserObject, jwt: string) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('ide_token', jwt);
    localStorage.setItem('ide_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ide_token');
    localStorage.removeItem('ide_user');
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Spawning isolated container...\nExecuting...');
    
    try {
      const response = await axios.post('http://localhost:5000/execute', {
        code,
        language
      });
      setOutput(response.data.output || 'Execution successful (No output)');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setOutput(error.response?.data?.message || 'A critical error occurred.');
      } else if (error instanceof Error) {
        setOutput(error.message);
      } else {
        setOutput('An unknown error occurred.');
      }
    } finally {
      setIsRunning(false);
    }
  };

  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <div style={{ width: '60%', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', backgroundColor: '#252526', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Collab-IDE ({sessionId})</h3>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as string)}
              style={{ padding: '4px', backgroundColor: '#333', color: '#fff', border: 'none' }}
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ (GCC)</option>
            </select>
          </div>
          
          <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#4caf50' }}>{user.username} ({user.role})</span>
            <button onClick={handleLogout} style={{ padding: '4px 8px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
        
        <div style={{ flexGrow: 1 }}>
          <CollaborativeEditor 
            sessionId={sessionId} 
            language={language}
            onCodeChange={setCode} 
          />
        </div>
      </div>

      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
        
        <div style={{ height: '50%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Terminal Output</h3>
            <button 
              onClick={handleRunCode} 
              disabled={isRunning}
              style={{ 
                padding: '6px 16px', 
                backgroundColor: isRunning ? '#555' : '#007acc', 
                color: '#fff', 
                border: 'none', 
                cursor: isRunning ? 'wait' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
          <pre style={{ padding: '15px', margin: 0, flexGrow: 1, overflowY: 'auto', color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>
            {output}
          </pre>
        </div>

        <div style={{ height: '50%', display: 'flex', flexDirection: 'column' }}>
          <Chat sessionId={sessionId} username={user.username} />
        </div>

      </div>

    </div>
  );
}
import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import axios from 'axios';
import CollaborativeEditor from './components/CollaborativeEditor';
import Login from './components/Login';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import Editor from '@monaco-editor/react';
import type { UserObject } from './types/interfaces';

export default function App() {
  const [user, setUser] = useState<UserObject | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('System Ready. Awaiting execution...');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [language, setLanguage] = useState('javascript');

  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [playbackCode, setPlaybackCode] = useState<string>('Loading history...');
  const [isPlaybackMode, setIsPlaybackMode] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (currentRoom && user) {
      const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
      const newSocket = io(`http://localhost:${backendPort}`);

      setSocket(newSocket);

      newSocket.on('receive-execution', (broadcastOutput: string) => {
        setOutput(broadcastOutput);
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [currentRoom, user]);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('ide_token');
    const savedUser = sessionStorage.getItem('ide_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (isPlaybackMode && currentRoom) {
      const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';

      axios.get(`http://localhost:${backendPort}/api/sessions/${currentRoom}/history`)
        .then(res => {
          setHistoryLogs(res.data);
          setPlaybackIndex(Math.max(0, res.data.length - 1));
        })
        .catch(err => {
          console.error("Failed to fetch history:", err);
          setPlaybackCode("Error loading history.");
        });
    }
  }, [isPlaybackMode, currentRoom]);

  useEffect(() => {
    if (!isPlaybackMode || historyLogs.length === 0) return;

    const tempDoc = new Y.Doc();
    const tempText = tempDoc.getText('monaco');

    for (let i = 0; i <= playbackIndex; i++) {
      const log = historyLogs[i];
      if (log && log.operation_data && log.operation_data.data) {
        const updateBuffer = new Uint8Array(log.operation_data.data);
        Y.applyUpdate(tempDoc, updateBuffer);
      }
    }

    setPlaybackCode(tempText.toString());
  }, [playbackIndex, historyLogs, isPlaybackMode]);

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
      const resultOutput = response.data.output || 'Execution successful (No output)';
      setOutput(resultOutput);

      if (user?.role === 'Instructor' && socket) {
        socket.emit('instructor-execution', {
          sessionId: currentRoom,
          output: `[Instructor Broadcast]:\n${resultOutput}`
        });
      }
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? (error.response?.data?.message || 'Error') : 'Error';
      setOutput(errorMsg);

      if (user?.role === 'Instructor' && socket) {
        socket.emit('instructor-execution', {
          sessionId: currentRoom,
          output: `[Instructor Broadcast Failed]:\n${errorMsg}`
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (!currentRoom) {
    return <Dashboard user={user} onJoinRoom={setCurrentRoom} onLogout={handleLogout} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>

      <div style={{ width: '60%', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', backgroundColor: '#252526', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Collab-IDE ({currentRoom})</h3>
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
            <button
              onClick={() => {
                setIsPlaybackMode(!isPlaybackMode);
                setPlaybackIndex(Math.max(0, historyLogs.length - 1));
              }}
              style={{ padding: '4px 10px', backgroundColor: isPlaybackMode ? '#ff9800' : '#4caf50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isPlaybackMode ? 'Exit Playback' : '⏪ Playback Mode'}
            </button>
            <span style={{ color: '#4caf50', fontSize: '12px' }}>{user.username} ({user.role})</span>
            <button
              onClick={() => setCurrentRoom(null)}
              style={{ padding: '4px 8px', backgroundColor: '#555', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
              Leave Room
            </button>
          </div>
        </div>

        {isPlaybackMode && historyLogs.length > 0 && (
          <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333' }}>
            <input
              type="range"
              min="0"
              max={historyLogs.length - 1}
              value={playbackIndex}
              onChange={(e) => setPlaybackIndex(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '8px', color: '#aaa' }}>
              Viewing Snapshot: <strong style={{ color: '#fff' }}>
                {new Date(historyLogs[playbackIndex].timestamp).toLocaleTimeString()}
              </strong>
            </div>
          </div>
        )}

        <div style={{ flexGrow: 1 }}>
          {isPlaybackMode ? (
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={playbackCode}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
            />
          ) : (
            <CollaborativeEditor
              currentRoom={currentRoom}
              language={language}
              currentUser={user}
              onCodeChange={setCode}
            />
          )}
        </div>
      </div>

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
          <Chat currentRoom={currentRoom} username={user.username} socket={socket} />
        </div>
      </div>

    </div>
  );
}
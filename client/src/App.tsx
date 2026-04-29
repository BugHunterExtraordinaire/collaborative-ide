import * as Y from 'yjs';
import axios from 'axios';

import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';

import CollaborativeEditor from './components/CollaborativeEditor';
import Login from './components/Login';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import Editor from '@monaco-editor/react';

import { type UserObject } from './types/interfaces';
import { type HistoryLogArray } from './types/arrays';

axios.defaults.withCredentials = true;

export default function App() {
  const [user, setUser] = useState<UserObject | null>(null);

  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('System Ready. Awaiting execution...');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [language, setLanguage] = useState('javascript');

  const [historyLogs, setHistoryLogs] = useState<HistoryLogArray>([]);
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

  const handleLoginSuccess = (userData: UserObject) => {
    setUser(userData);
    sessionStorage.setItem('ide_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    try {
      await axios.post(`http://localhost:${backendPort}/api/auth/logout`);
    } catch (error) {
      console.error("Logout failed", error);
    }
    setUser(null);
    sessionStorage.removeItem('ide_user');
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Spawning isolated container...\nExecuting...');
    try {
      const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
      const response = await axios.post(`http://localhost:${backendPort}/api/execute`, { code, language });
      const resultOutput = response.data.output || 'Execution successful (No output)';
      setOutput(resultOutput);

      if (user?.role === 'Instructor' && socket) {
        socket.emit('instructor-execution', {
          sessionId: currentRoom,
          output: `[Instructor Broadcast]:\n${resultOutput}`
        });
      }

      if (user?.role === 'Student' && socket) {
        socket.emit('student-execution', {
          sessionId: currentRoom,
          output: `[${user?.username} Broadcast]:\n${resultOutput}`
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

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;
  if (!currentRoom) return <Dashboard user={user} onJoinRoom={setCurrentRoom} onLogout={handleLogout} />;

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">

      <div className="w-3/5 border-r border-zinc-800 flex flex-col bg-zinc-900">

        <div className="p-3 bg-zinc-800 flex justify-between items-center border-b border-zinc-700">
          <div className="flex items-center gap-4">
            <h3 className="m-0 text-md font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Collab-IDE <span className="text-zinc-400 text-sm font-mono">({currentRoom})</span>
            </h3>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="p-1.5 bg-zinc-700 text-white border-none outline-none rounded text-sm cursor-pointer hover:bg-zinc-600 transition-colors"
              disabled={isPlaybackMode}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsPlaybackMode(!isPlaybackMode);
                setPlaybackIndex(Math.max(0, historyLogs.length - 1));
              }}
              className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${isPlaybackMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-zinc-700 hover:bg-zinc-600'
                } text-white border-none cursor-pointer`}
            >
              {isPlaybackMode ? 'Exit Playback' : '⏪ Playback Mode'}
            </button>
            <span className="text-zinc-300 text-sm">
              {user.username} <span className="text-green-500">({user.role})</span>
            </span>
            <button
              onClick={() => setCurrentRoom(null)}
              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded transition-colors cursor-pointer"
            >
              Leave Room
            </button>
          </div>
        </div>

        {isPlaybackMode && historyLogs.length > 0 && (
          <div className="p-4 bg-zinc-900 border-b border-zinc-800">
            <input
              type="range"
              min="0"
              max={historyLogs.length - 1}
              value={playbackIndex}
              onChange={(e) => setPlaybackIndex(Number(e.target.value))}
              className="w-full cursor-pointer accent-orange-500"
            />
            <div className="text-center text-sm mt-2 text-zinc-400">
              Viewing Snapshot: <strong className="text-orange-400">
                {new Date(historyLogs[playbackIndex].timestamp).toLocaleTimeString()}
              </strong>
            </div>
          </div>
        )}

        <div className="grow">
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

      <div className="w-2/5 flex flex-col bg-zinc-900">

        <div className="h-1/2 flex flex-col border-b border-zinc-800">
          <div className="p-3 bg-zinc-800 border-b border-zinc-700 flex justify-between items-center">
            <h3 className="m-0 text-sm font-bold text-zinc-100 uppercase tracking-wider">Terminal Output</h3>
            <button
              onClick={handleRunCode}
              disabled={isRunning || isPlaybackMode}
              className={`px-4 py-1.5 text-sm font-bold rounded transition-colors ${isRunning || isPlaybackMode ? 'bg-zinc-600 cursor-not-allowed text-zinc-400' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer text-white'
                }`}
            >
              {isRunning ? 'Running...' : 'Run Code ▶'}
            </button>
          </div>
          <pre className="p-4 m-0 grow overflow-y-auto text-zinc-300 whitespace-pre-wrap font-mono text-sm bg-black">
            {output}
          </pre>
        </div>

        <div className="h-1/2 flex flex-col">
          <Chat currentRoom={currentRoom} username={user.username} socket={socket} />
        </div>
      </div>

    </div>
  );
}
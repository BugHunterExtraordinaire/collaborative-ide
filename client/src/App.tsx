import * as Y from 'yjs';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import CollaborativeEditor from './components/CollaborativeEditor';
import Editor from '@monaco-editor/react';

import EditorToolbar from './components/workspace/EditorToolbar';
import PlaybackScrubber from './components/workspace/PlaybackScrubber';
import TerminalPanel from './components/workspace/TerminalPanel';

import { type UserObject } from './types/interfaces';

import { type HistoryLogArray } from './types/arrays';

axios.defaults.withCredentials = true;

export default function App() {
  const [user, setUser] = useState<UserObject | null>(null);

  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('System Ready. Awaiting execution...');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [playbackCode, setPlaybackCode] = useState<string>('Loading history...');
  const [isPlaybackMode, setIsPlaybackMode] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (currentRoom && user) {
      const backendPort = new URLSearchParams(window.location.search).get('port') || '80';
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
    const savedUser = sessionStorage.getItem('ide_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  const backendPort = new URLSearchParams(window.location.search).get('port') || '80';

  const { data: historyLogs = [] } = useQuery<HistoryLogArray>({
    queryKey: ['session-history', currentRoom],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:${backendPort}/api/sessions/${currentRoom}/history`);
      setPlaybackIndex(Math.max(0, res.data.length - 1));
      return res.data;
    },
    enabled: isPlaybackMode && !!currentRoom,
    refetchOnWindowFocus: false,
  });

  const { data: sessionDetails } = useQuery({
    queryKey: ['session-details', currentRoom],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:${backendPort}/api/sessions/${currentRoom}`);
      return res.data;
    },
    enabled: !!currentRoom,
  });

  const language = sessionDetails?.language || 'javascript';

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
    const backendPort = new URLSearchParams(window.location.search).get('port') || '80';
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
      const backendPort = new URLSearchParams(window.location.search).get('port') || '80';

      const response = await axios.post(`http://localhost:${backendPort}/api/execute`, { 
        code, 
        language,
        sessionId: currentRoom 
      });
      
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

        <EditorToolbar
          currentRoom={currentRoom}
          language={language}
          isPlaybackMode={isPlaybackMode}
          setIsPlaybackMode={setIsPlaybackMode}
          historyLength={historyLogs.length}
          setPlaybackIndex={setPlaybackIndex}
          user={user}
          onLeaveRoom={() => setCurrentRoom(null)}
        />

        {isPlaybackMode && (
          <PlaybackScrubber
            historyLogs={historyLogs}
            playbackIndex={playbackIndex}
            setPlaybackIndex={setPlaybackIndex}
          />
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

        <TerminalPanel
          output={output}
          isRunning={isRunning}
          isPlaybackMode={isPlaybackMode}
          onRunCode={handleRunCode}
        />

        <div className="h-1/2 flex flex-col">
          <Chat currentRoom={currentRoom} username={user.username} socket={socket} />
        </div>

      </div>
    </div>
  );
}
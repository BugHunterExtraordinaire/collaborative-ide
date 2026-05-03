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
import FileTabs from './components/workspace/FileTabs';

import EditorToolbar from './components/workspace/EditorToolbar';
import PlaybackScrubber from './components/workspace/PlaybackScrubber';
import TerminalPanel from './components/workspace/TerminalPanel';

import { useCollabEngine } from './components/hooks/useCollabEngine';
import { type UserObject } from './types/interfaces';
import { type HistoryLogArray } from './types/arrays';

axios.defaults.withCredentials = true;

export default function App() {
  const [user, setUser] = useState<UserObject | null>(null);

  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [output, setOutput] = useState<string>('System Ready. Awaiting execution...');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [playbackCode, setPlaybackCode] = useState<string>('Loading history...');
  const [isPlaybackMode, setIsPlaybackMode] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { status: yjsStatus, localDoc, provider, isSynced } = useCollabEngine(currentRoom);

  useEffect(() => {
    if (currentRoom && user) {
      const backendPort = new URLSearchParams(window.location.search).get('port') || '80';
      
      const newSocket = io(`http://localhost:${backendPort}`, { forceNew: true });
      setSocket(newSocket);

      newSocket.on('receive-execution', (data: { sessionId: string, output: string }) => {
        if (data.sessionId === currentRoom) {
          setOutput(data.output);
        }
      });

      return () => {
        newSocket.off('receive-execution');
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

  const { data: sessionDetails, isSuccess: isSessionLoaded } = useQuery({
    queryKey: ['session-details', currentRoom],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:${backendPort}/api/sessions/${currentRoom}`);
      return res.data;
    },
    enabled: !!currentRoom,
  });

  const language: string = (sessionDetails?.language || 'JavaScript').toLowerCase();

  useEffect(() => {
    if (!localDoc) return;
    
    const yFiles = localDoc.getArray<string>('file-list');

    const updateFiles = () => {
      const syncedFiles = yFiles.toArray();
      const uniqueFiles = Array.from(new Set(syncedFiles)); 
      
      if (uniqueFiles.length > 0) {
        setFiles(uniqueFiles);
        
        setActiveFile(prevActive => {
          if (!prevActive || !uniqueFiles.includes(prevActive)) {
            return uniqueFiles[0];
          }
          return prevActive;
        });
      }
    };

    yFiles.observe(updateFiles);
    updateFiles();

    if (isSynced && isSessionLoaded && yFiles.length === 0) {
       const defaultFile = language === 'python' ? 'main.py' : language === 'javascript' ? 'main.js' : 'main.cpp';
       
       if (!yFiles.toArray().includes(defaultFile)) {
         yFiles.push([defaultFile]);
         setActiveFile(defaultFile); 
       }
    }

    return () => yFiles.unobserve(updateFiles);
  }, [localDoc, language, isSynced, isSessionLoaded]);

  const safeActiveFile = activeFile || files[0] || '';

  useEffect(() => {
    if (!isPlaybackMode || historyLogs.length === 0) return;
    const tempDoc = new Y.Doc();
    const tempText = tempDoc.getText(safeActiveFile);
    for (let i = 0; i <= playbackIndex; i++) {
      const log = historyLogs[i];
      if (log && log.operation_data && log.operation_data.data) {
        const updateBuffer = new Uint8Array(log.operation_data.data);
        Y.applyUpdate(tempDoc, updateBuffer);
      }
    }
    setPlaybackCode(tempText.toString());
  }, [playbackIndex, historyLogs, isPlaybackMode, safeActiveFile]);

  const handleLoginSuccess = (userData: UserObject) => {
    setUser(userData);
    sessionStorage.setItem('ide_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await axios.post(`http://localhost:${backendPort}/api/auth/logout`);
    } catch (error) {
      console.error("Logout failed", error);
    }
    setUser(null);
    sessionStorage.removeItem('ide_user');
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setOutput('System Ready. Awaiting execution...');
    setFiles([]);
    setActiveFile('');
    setIsRunning(false);
    setIsPlaybackMode(false);
    setPlaybackIndex(0);
    setPlaybackCode('Loading history...');
  };

  const handleRunCode = async () => {
    if (!localDoc) return;

    setIsRunning(true);
    setOutput('Spawning isolated container...\nExecuting...');
    try {
      const filesPayload = files.map(fileName => ({
        name: fileName,
        content: localDoc.getText(fileName).toString()
      }));

      const response = await axios.post(`http://localhost:${backendPort}/api/execute`, { 
        files: filesPayload, 
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
        
        <div className="absolute top-2 right-[41%] z-10 text-xs font-mono px-2 py-1 bg-black/50 rounded border border-zinc-700 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${yjsStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          {yjsStatus}
        </div>

        <EditorToolbar
          currentRoom={currentRoom}
          language={language}
          isPlaybackMode={isPlaybackMode}
          setIsPlaybackMode={setIsPlaybackMode}
          historyLength={historyLogs.length}
          setPlaybackIndex={setPlaybackIndex}
          user={user}
          onLeaveRoom={handleLeaveRoom}
        />

        <FileTabs 
          files={files}
          activeFile={safeActiveFile}
          onSelectFile={setActiveFile}
          onAddFile={(newFile) => {
            localDoc?.getArray<string>('file-list').push([newFile]);
            setActiveFile(newFile);
          }}
          isPlaybackMode={isPlaybackMode}
        />

        {isPlaybackMode && (
          <PlaybackScrubber
            historyLogs={historyLogs}
            playbackIndex={playbackIndex}
            setPlaybackIndex={setPlaybackIndex}
          />
        )}

        <div className="grow relative">
          {isPlaybackMode ? (
            <Editor
              height="100%"
              theme="vs-dark"
              language={language.toLowerCase()}
              path={safeActiveFile}
              value={playbackCode}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
            />
          ) : (
            <CollaborativeEditor
              language={language}
              currentUser={user}
              activeFile={safeActiveFile}
              localDoc={localDoc}
              provider={provider}
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

        <div className="h-1/2 flex flex-col border-t border-zinc-800">
          <Chat currentRoom={currentRoom} username={user.username} socket={socket} />
        </div>
      </div>
    </div>
  );
}
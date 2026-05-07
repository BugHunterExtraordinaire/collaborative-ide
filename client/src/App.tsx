import * as Y from 'yjs';
import axios from 'axios';

import { io, Socket } from 'socket.io-client';
import { useState, useEffect, useMemo, createContext } from 'react';
import { useQuery } from '@tanstack/react-query';

import Login from './components/Login';

import { Dashboard } from './components/Dashboard';

import { useCollabEngine } from './components/hooks/useCollabEngine';

import { type DashboardProps, type UserObject, type WorkspaceProps } from './types/interfaces';
import { type HistoryLogArray } from './types/arrays';
import Workspace from './components/Workspace';

axios.defaults.withCredentials = true;

const DashboardContext = createContext<DashboardProps | null>(null);
const WorkspaceContext = createContext<WorkspaceProps | null>(null);

function App() {
  const [user, setUser] = useState<UserObject | null>(() => {
    const savedUser = sessionStorage.getItem('ide_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [files, setFiles] = useState<Array<string>>([]);
  const [activeFile, setActiveFile] = useState<string>('');

  const [output, setOutput] = useState<string>('System Ready. Awaiting execution...');

  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [isPlaybackMode, setIsPlaybackMode] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { status: yjsStatus, localDoc, provider, isSynced } = useCollabEngine(currentRoom);

  useEffect(() => {
    if (currentRoom && user) {
      const newSocket = io("http://localhost:80", { forceNew: true });

      newSocket.on('connect', () => {
        setSocket(newSocket);
      });

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

  const { data: historyLogs = [] } = useQuery<HistoryLogArray>({
    queryKey: ['session-history', currentRoom],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:80/api/v1/sessions/${currentRoom}/history`);
      setPlaybackIndex(Math.max(0, res.data.length - 1));
      return res.data;
    },
    enabled: isPlaybackMode && !!currentRoom,
    refetchOnWindowFocus: false,
  });

  const { data: sessionDetails, isSuccess: isSessionLoaded } = useQuery({
    queryKey: ['session-details', currentRoom],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:80/api/v1/sessions/${currentRoom}`);
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
      }
    }

    return () => yFiles.unobserve(updateFiles);
  }, [localDoc, language, isSynced, isSessionLoaded]);

  const safeActiveFile = activeFile || files[0] || '';

  const playbackCode = useMemo(() => {
    if (!isPlaybackMode || historyLogs.length === 0) return 'Loading history...';

    const tempDoc = new Y.Doc();
    const tempText = tempDoc.getText(safeActiveFile);

    for (let i = 0; i <= playbackIndex; i++) {
      const log = historyLogs[i];
      if (log && log.operationData && log.operationData.data) {
        const updateBuffer = new Uint8Array(log.operationData.data);
        Y.applyUpdate(tempDoc, updateBuffer);
      }
    }
    return tempText.toString();
  }, [playbackIndex, historyLogs, isPlaybackMode, safeActiveFile]);

  const handleLoginSuccess = (userData: UserObject) => {
    setUser(userData);
    sessionStorage.setItem('ide_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:80/api/v1/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    }
    setUser(null);
    sessionStorage.removeItem('ide_user');
  };

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  if (!currentRoom) {
    return (
      <DashboardContext.Provider value={{
        user,
        onJoinRoom: (sessionId: string) => setCurrentRoom(sessionId),
        onLogout: handleLogout
      }}>
        <Dashboard />
      </DashboardContext.Provider>
    );
  };

  return (
    <WorkspaceContext.Provider value={{
      yjsStatus,
      currentRoom,
      language,
      isPlaybackMode,
      playbackIndex,
      playbackCode,
      localDoc,
      provider,
      output,
      isRunning,
      socket,
      historyLogs,
      user,
      files,
      safeActiveFile,
      setActiveFile,
      setIsPlaybackMode,
      setPlaybackIndex,
      setCurrentRoom,
      setOutput,
      setFiles,
      setIsRunning,
    }}>
      <Workspace />
    </WorkspaceContext.Provider>
  );
}

export {
  DashboardContext,
  WorkspaceContext,
  App,
}
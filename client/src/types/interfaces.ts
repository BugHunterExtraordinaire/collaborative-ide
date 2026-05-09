import * as Y from 'yjs';

import type { UseMutationResult } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';

import type { SessionsArray, HistoryLogArray } from './arrays';
import type { WebsocketProvider } from 'y-websocket';

export interface UserObject {
  userId: string;
  username: string;
  role: string;
}

export interface LoginProps {
  onLoginSuccess: (user: UserObject) => void;
}

export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface DashboardProps {
  user: UserObject;
  onJoinRoom: (sessionId: string) => void;
  onLogout: () => void;
}

export interface SessionProps {
  session: SessionObject;
  isAdmin: boolean;
  joinBtnText: string;
}

export interface CreateSessionFormProps {
  handleCreate: React.SubmitEventHandler<HTMLFormElement>;
  newRoomName: string;
  setNewRoomName: (name: string) => void;
  language: string;
  setLanguage: (name: string) => void;
  createBtnText: string;
}

export interface JoinSessionFormProps {
  handleJoin: React.SubmitEventHandler<HTMLFormElement>;
  joinId: string;
  setJoinId: (joinId: string) => void;
  joinBtnText: string;
}

export interface WorkspaceProps {
  yjsStatus: string;
  currentRoom: string;
  language: string;
  isPlaybackMode: boolean;
  playbackIndex: number;
  playbackCode: string;
  localDoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  socket: Socket | null;
  historyLogs: HistoryLogArray;
  user: UserObject;
  files: Array<string>;
  safeActiveFile: string;
  setActiveFile: (activeFile: string) => void;
  setIsPlaybackMode: (isPlaybackMode: boolean) => void;
  setPlaybackIndex: (playbackIndex: number) => void;
  setCurrentRoom: (currentRoom: string | null) => void;
  setFiles: (files: Array<string>) => void;
}

export interface UserDashboardProps {
  user: UserObject;
  onJoinRoom: (sessionId: string) => void;
  onLogout: () => void;
  handleDeleteSession: (sessionId: string) => void;
  handleCreateSession: (name: string, language: string) => void;
  sessions: SessionsArray; 
}

export interface DockerContainer {
  Id: string;
  Image: string;
  State: string;
  Status: string;
}

export interface DockerContainerProps {
  container: DockerContainer;
  killContainerMutation: UseMutationResult<void, Error, string, unknown>;
}

export interface HeaderProps {
  user: UserObject;
  onLogout: () => void;
}

export interface HistoryLog {
  _id: string;
  sessionId: string;
  operationData: {
    type: 'Buffer';
    data: Array<number>;
  };
  timestamp: string;
}

export interface AuthenticationProps {
  onSuccess: (user: UserObject) => void;
  onToggleMode: () => void;
}

export interface MessageBubbleProps {
  msg: Message;
  currentUser: string;
}

export interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}

export interface AnalyticsModalProps {
  setShowAnalytics: (showAnalytics: boolean) => void;
}

export interface ExecutionStats {
  total: number;
  success: number;
  errors: number;
}

export interface WorkspaceComponentProps {
  currentRoom: string;
  user: UserObject;
  setCurrentRoom: (room: string | null) => void;
}

export interface FileProps {
  file: string;
  safeActiveFile: string;
  setActiveFile: (file: string) => void;
}

export interface UserTrackingProps {
  username: string;
  stats: ExecutionStats;
}

export interface AwarenessState {
  user?: {
    name: string;
    color: string;
  };
  [key: string]: unknown;
}

export interface ActiveUser {
  clientId: number;
  state: AwarenessState;
}

export interface BlameRecord {
  name: string;
  color: string;
}

export interface SessionObject {
  sessionId: string;
  name: string;
  owner: string;
  ownerId: string;
  createdAt: Date;
}

export interface Contributor {
  name: string;
  color: string;
  count: number;
  lastEdited: number;
}
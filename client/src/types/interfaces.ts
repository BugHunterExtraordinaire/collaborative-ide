import { Socket } from 'socket.io-client';

import { type SessionsArray } from './arrays';

export interface UserObject {
  username: string;
  role: string;
}

export interface LoginProps {
  onLoginSuccess: (user: UserObject) => void;
}

export interface ChatProps {
  currentRoom: string;
  username: string;
  socket: Socket | null;
}

export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface DashboardProps {
  user: { username: string; role: string };
  onJoinRoom: (sessionId: string) => void;
  onLogout: () => void;
}

export interface CollaborativeEditorProps {
  currentRoom: string;
  language: string;
  currentUser: { username: string; role: string };
  onCodeChange: (code: string) => void;
}

export interface DockerContainer {
  Id: string;
  Image: string;
  State: string;
  Status: string;
}

export interface HeaderProps {
  user: UserObject;
  onLogout: () => void;
}

export interface FormProps {
  createTitle: string;
  createBtnText: string;
  joinTitle: string;
  joinBtnText: string;
  onCreate: (name: string) => void;
  onJoin: (id: string) => void;
}

export interface ListProps {
  title: string;
  sessions: SessionsArray;
  currentUser: UserObject;
  joinBtnText: string;
  onJoin: (id: string) => void;
  onDelete?: (id: string) => void;
}
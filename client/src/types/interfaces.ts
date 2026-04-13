export interface UserObject {
  username: string;
  role: string;
}

export interface LoginProps {
  onLoginSuccess: (user: UserObject, token: string) => void;
}

export interface ChatProps {
  currentRoom: string;
  username: string;
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
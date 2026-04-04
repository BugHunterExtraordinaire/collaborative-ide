export interface UserObject {
  username: string;
  role: string;
}

export interface LoginProps {
  onLoginSuccess: (user: UserObject, token: string) => void;
}

export interface ChatProps {
  sessionId: string;
  username: string;
}

export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

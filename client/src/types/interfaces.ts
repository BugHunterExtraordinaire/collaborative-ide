export interface UserObject {
  username: string;
  role: string;
}

export interface LoginProps {
  onLoginSuccess: (user: UserObject, token: string) => void;
}
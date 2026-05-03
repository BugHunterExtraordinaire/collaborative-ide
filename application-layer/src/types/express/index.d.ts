export interface UserPayload {
  userId: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    export interface Request {
      user?: UserPayload; 
    }
  }
}

export {};
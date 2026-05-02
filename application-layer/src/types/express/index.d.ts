interface UserPayload {
  userId: string;
  username: string;
  role: string;
}

declare namespace Express {
  export interface Request {
    user?: UserPayload; 
  }
}
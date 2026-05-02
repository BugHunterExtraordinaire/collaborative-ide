import { Document } from "mongoose"
import jwt from "jsonwebtoken"

interface IUser extends Document {
  username: string;
  email: string;
  password_hash: string;
  role: 'Student' | 'Instructor';
  created_at: Date;
  verifyPassword(password: string): Promise<boolean>;
  generateJWT(payload: jwt.JwtPayload): string;
}

interface ISession extends Document {
  session_id: string;
  name: string;
  owner: string;
  participants: Array<string>;
  language: string;
  state: Buffer;
  chat_history: Array<{ username: string; message: string; timestamp: Date }>;
  created_at: Date;
  updated_at: Date;
}

interface IOperationLog extends Document {
  session_id: string;
  timestamp: Date;
  operation_data: Buffer;
}

interface IExecutionLog extends Document {
  session_id: string;
  username: string;
  input: string;
  output: string;
  status: 'Success' | 'Error' | 'Timeout';
  duration_ms: number;
  createdAt: Date;
}

export {
  IUser,
  ISession,
  IOperationLog,
  IExecutionLog,
}
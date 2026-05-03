import { Document } from "mongoose"
import jwt from "jsonwebtoken"

interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'Student' | 'Instructor';
  created_at: Date;
  verifyPassword(password: string): Promise<boolean>;
  generateJWT(payload: jwt.JwtPayload): string;
}

interface ISession extends Document {
  sessionId: string;
  name: string;
  owner: string;
  participants: Array<string>;
  language: string;
  state: Buffer;
  chatHistory: Array<{ username: string; message: string; timestamp: Date }>;
  created_at: Date;
  updated_at: Date;
}

interface IOperationLog extends Document {
  sessionId: string;
  timestamp: Date;
  operationData: Buffer;
}

interface IExecutionLog extends Document {
  sessionId: string;
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
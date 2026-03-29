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

export {
  IUser
}
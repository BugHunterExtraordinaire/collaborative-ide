import mongoose from "mongoose";
import bcryptjs from 'bcryptjs';
import { IUser } from "../types/mongoose/interfaces";
import jwt , { JwtPayload } from "jsonwebtoken";

const userSchema: mongoose.Schema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
  },
  password_hash: { 
    type: String, 
    required: true,
  },
  role: { 
    type: String, 
    enum: ['Student', 'Instructor'], 
    default: 'Student',
  },
  created_at: { 
    type: Date, 
    default: Date.now,
  },
});

userSchema.pre('save', async function(this: IUser) {
  const salt = await bcryptjs.genSalt(12);
  this.password_hash = await bcryptjs.hash(this.password_hash, salt);
});

userSchema.method('verifyPassword', async function(this: IUser, password) {
  return await bcryptjs.compare(password, this.password_hash);
});

userSchema.method('generateJWT', function(payload: JwtPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: process.env.JWT_LIFETIME as any });
});

export default mongoose.model<IUser>("User", userSchema);
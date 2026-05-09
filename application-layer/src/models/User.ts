import mongoose from "mongoose";
import bcryptjs from 'bcryptjs';
import jwt from "jsonwebtoken";

import { config } from "../config/env";

import { IUser } from "../types/mongoose/interfaces";

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
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email"],
  },
  passwordHash: { 
    type: String, 
    required: true,
  },
  role: { 
    type: String, 
    enum: ['Student', 'Instructor', 'System Administrator'], 
    default: 'Student',
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(this: IUser) {
  const salt = await bcryptjs.genSalt(12);
  this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
});

userSchema.method('verifyPassword', async function(this: IUser, password) {
  return await bcryptjs.compare(password, this.passwordHash);
});

userSchema.method('generateJWT', function(payload: jwt.JwtPayload) {
  return jwt.sign(payload, config.JWT_SECRET as string, { expiresIn: config.JWT_LIFETIME as any });
});

export default mongoose.model<IUser>("User", userSchema);
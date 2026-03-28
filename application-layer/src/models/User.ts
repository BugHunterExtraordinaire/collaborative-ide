import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/mongoose/interfaces";

const userSchema: Schema = new Schema({
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

export default mongoose.model<IUser>("User", userSchema);
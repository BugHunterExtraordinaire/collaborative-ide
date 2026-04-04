import mongoose from "mongoose";
import { ISession } from "../types/mongoose/interfaces";

const sessionSchema: mongoose.Schema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
  },
  state: {
    type: Buffer,
  },
  chat_history: [{
    username: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
});

export default mongoose.model<ISession>('Session', sessionSchema);
import mongoose from "mongoose";
import { ISession } from "../types/mongoose/interfaces";

const sessionSchema: mongoose.Schema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  participants: [{
    type: String,
  }],
  language: {
    type: String,
    enum: ["JavaScript", "Python", "C++"],
    required: true,
    default: "JavaScript",
  },
  state: {
    type: Buffer,
  },
  chatHistory: [{
    username: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
});

export default mongoose.model<ISession>('Session', sessionSchema);
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
}, {
  timestamps: true,
});

export default mongoose.model<ISession>('Session', sessionSchema);
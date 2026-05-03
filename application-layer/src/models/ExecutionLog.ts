import mongoose, { Schema } from 'mongoose';
import { IExecutionLog } from '../types/mongoose/interfaces';

const ExecutionLogSchema = new Schema({
  sessionId: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  input: { 
    type: String, 
    required: true 
  },
  output: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Success', 'Error', 'Timeout'], 
    required: true 
  },
  duration_ms: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model<IExecutionLog>('ExecutionLog', ExecutionLogSchema);
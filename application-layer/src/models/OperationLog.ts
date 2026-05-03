import mongoose, { Schema } from 'mongoose';
import { IOperationLog } from '../types/mongoose/interfaces';

const OperationLogSchema: Schema = new Schema({
  sessionId: { 
    type: String, 
    required: true, 
    index: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  operationData: { 
    type: Buffer, 
    required: true 
  }
});

export default mongoose.model<IOperationLog>('OperationLog', OperationLogSchema);
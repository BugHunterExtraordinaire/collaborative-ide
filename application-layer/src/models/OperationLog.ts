import mongoose, { Schema } from 'mongoose';
import { IOperationLog } from '../types/mongoose/interfaces';

const OperationLogSchema: Schema = new Schema({
  session_id: { 
    type: String, 
    required: true, 
    index: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  operation_data: { 
    type: Buffer, 
    required: true 
  }
});

export default mongoose.model<IOperationLog>('OperationLog', OperationLogSchema);
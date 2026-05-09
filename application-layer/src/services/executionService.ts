import axios from 'axios';

import { config } from '../config/env';

import ExecutionLog from '../models/ExecutionLog';

import { FilePayload, ExecutionResult } from '../types/executionService/interfaces';

const ExecutionService = {
  runAndLog: async (
    files: Array<FilePayload>, 
    language: string, 
    sessionId: string, 
    userId: string
  ): Promise<ExecutionResult> => {
    const startTime = performance.now();
    let finalOutput = '';
    let execStatus = 'Success';
    let statusCode = 200;
    
    try {
      const runnerResponse = await axios.post(`${config.EXECUTION_LAYER_URL}//api/v1/execute`, { files, language });
      
      finalOutput = runnerResponse.data.output || '';
      
      if (runnerResponse.data.status && runnerResponse.data.status !== 'Success') {
        execStatus = runnerResponse.data.status;
      } else if (runnerResponse.data.error || runnerResponse.data.stderr || /Traceback|Error:|Exception|ReferenceError|SyntaxError/i.test(finalOutput)) {
        execStatus = 'Error';
      }

    } catch (error: any) {
      console.error('Execution proxy failed:', error.message);
      
      finalOutput = error.response?.data?.output || error.response?.data?.message || 'Execution service unavailable.';
      execStatus = finalOutput.includes('timed out') ? 'Timeout' : 'Error';
      statusCode = error.response?.status || 500;

    } finally {
      const duration_ms = Math.round(performance.now() - startTime);
      
      if (sessionId) {
        ExecutionLog.create({
          sessionId: sessionId,
          userId: userId,
          input: JSON.stringify(files), 
          output: finalOutput,
          status: execStatus,
          duration_ms: duration_ms
        }).catch(err => console.error('Failed to save ExecutionLog to MongoDB:', err));
      }
    }

    return {
      output: finalOutput,
      status: execStatus,
      statusCode
    };
  }
};

export default ExecutionService;
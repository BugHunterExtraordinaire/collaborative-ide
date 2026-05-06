import axios from 'axios';

import ExecutionLog from '../models/ExecutionLog';

import { DefaultController } from '../types/express/functions';

export const executeCode: DefaultController = async (req, res) => {
  const { files, language, sessionId } = req.body; 
  
  const username = req.user?.username || 'Unknown'; 
  const startTime = performance.now();
  let finalOutput = '';
  let execStatus = 'Success';

  try {
    const runnerResponse = await axios.post('http://localhost:5000/execute', { files, language });
    
    finalOutput = runnerResponse.data.output || '';
    
    if (runnerResponse.data.status && runnerResponse.data.status !== 'Success') {
      execStatus = runnerResponse.data.status;
    } else if (runnerResponse.data.error || runnerResponse.data.stderr || /Traceback|Error:|Exception|ReferenceError|SyntaxError/i.test(finalOutput)) {
      execStatus = 'Error';
    }

    res.status(200).json(runnerResponse.data);

  } catch (error: any) {
    console.error('Execution proxy failed:', error.message);
    
    finalOutput = error.response?.data?.output || error.response?.data?.message || 'Execution service unavailable.';
    execStatus = finalOutput.includes('timed out') ? 'Timeout' : 'Error';
    
    res.status(error.response?.status || 500).json({ output: finalOutput, status: execStatus });

  } finally {
    const duration_ms = Math.round(performance.now() - startTime);
    if (sessionId) {
      ExecutionLog.create({
        sessionId: sessionId,
        username: username,
        input: JSON.stringify(files), 
        output: finalOutput,
        status: execStatus,
        duration_ms: duration_ms
      }).catch(err => console.error('Failed to save ExecutionLog to MongoDB:', err));
    }
  }
};
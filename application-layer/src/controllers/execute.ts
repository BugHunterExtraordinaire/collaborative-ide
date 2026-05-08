import ExecutionService from '../services/executionService';

import { DefaultController } from '../types/express/functions';

export const executeCode: DefaultController = async (req, res) => {
  const { files, language, sessionId } = req.body; 
  const username = req.user?.username || 'Unknown'; 

  if (!files || files.length === 0 || !language) {
    res.status(400).json({ message: "Files and language are required parameters." });
    return;
  }

  const result = await ExecutionService.runAndLog(files, language, sessionId, username);

  res.status(result.statusCode).json({ 
    output: result.output, 
    status: result.status 
  });
};
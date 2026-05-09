import ExecutionService from '../services/executionService';

import { DefaultController } from '../types/express/functions';

import { BadRequestError } from '../types/express/errors';

export const executeCode: DefaultController = async (req, res) => {
  const { files, language, sessionId } = req.body; 
  const userId = req.user!.userId; 

  if (!files || files.length === 0 || !language) throw new BadRequestError("Files and language are required parameters.");

  const result = await ExecutionService.runAndLog(files, language, sessionId, userId);

  res.status(result.statusCode).json({ 
    output: result.output, 
    status: result.status 
  });
};
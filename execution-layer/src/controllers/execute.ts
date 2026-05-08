import Docker from 'dockerode';

import { docker, ensureImageExists } from '../services/dockerService';

import { ExecutionRequest } from '../types/interfaces';
import { DefaultController } from '../types/functions';

export const executeCode: DefaultController = async (req, res) => {
  const { files, language } = req.body as ExecutionRequest;

  if (!files || files.length === 0 || !language) {
    res.status(400).json({ message: "Error: please provide files and language." });
    return;
  }

  let dockerImg: string = "";
  let executionCmd: Array<string> = [];

  const fileCreationCmds = files.map(f => {
    const safeName = f.name.replace(/[^a-zA-Z0-9_.-]/g, '');
    const b64 = Buffer.from(f.content).toString('base64');
    return `echo '${b64}' | base64 -d > ${safeName}`;
  }).join(' && ');

  const rawMainFile = files.find(f => f.name.startsWith('main'))?.name || files[0].name;
  const mainFile = rawMainFile.replace(/[^a-zA-Z0-9_.-]/g, '');

  if (language === 'python') {
    dockerImg = 'python:3.9-alpine';
    executionCmd = ['sh', '-c', `${fileCreationCmds} && python ${mainFile}`];
  } else if (language === 'javascript') {
    dockerImg = 'node:18-alpine';
    executionCmd = ['sh', '-c', `${fileCreationCmds} && node ${mainFile}`];
  } else if (language === 'c++') {
    dockerImg = 'frolvlad/alpine-gxx';
    executionCmd = ['sh', '-c', `${fileCreationCmds} && g++ *.cpp -o main && ./main`];
  } else {
    res.status(400).json({ message: "Error: Unsupported language." });
    return;
  }

  let container: Docker.Container | null = null;

  try {
    await ensureImageExists(dockerImg);

    container = await docker.createContainer({
      Image: dockerImg,
      Cmd: executionCmd,
      Env: ["FORCE_COLOR=0"],
      Tty: true,
      HostConfig: {
        Memory: 128 * 1024 * 1024, 
        NanoCpus: 500000000,       
        NetworkMode: 'none'
      }
    });

    await container.start();

    let timer: NodeJS.Timeout;
    const timeoutLimit = 10000;

    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(async () => {
        await container?.kill();
        reject(new Error("Execution timed out (Limit: 10 seconds). Infinite loops are not allowed."));
      }, timeoutLimit);
    });

    await Promise.race([
      container.wait(),
      timeoutPromise
    ]);

    clearTimeout(timer!);
    
    const logs = await container.logs({ stdout: true, stderr: true });

    const rawLogs = Buffer.isBuffer(logs) ? logs.toString('utf8') : String(logs);
    const output = rawLogs.replace(/\x1b\[[0-9;]*m/g, "").trim();

    res.status(200).json({ output });
  } catch (error: any) {
    console.error(`Execution Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
        console.log(`Container cleaned up successfully.`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup container: ${cleanupError}`);
      }
    }
  }
};
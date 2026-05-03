import express from 'express';
import Docker from 'dockerode';
import cors from 'cors';
import helmet from 'helmet';

import { ExecutionRequest } from './types/interfaces';

const app = express();
const port = process.env.PORT || 5000;
const docker = new Docker();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

async function ensureImageExists(docker: Docker, imageName: string): Promise<void> {
  try {
    await docker.getImage(imageName).inspect();
    return;
  } catch (error) {
    console.log(`Image not found locally. Pulling ${imageName}...`);
    return new Promise((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err, output) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }
}

app.post('/execute', async (req, res): Promise<void> => {
  const { files, language } = req.body as ExecutionRequest;

  if (!files || files.length === 0 || !language) {
    res.status(400).json({ message: "Error: please provide files and language." });
    return;
  }

  let dockerImg: string = "";
  let executionCmd: Array<string> = [];

  const fileCreationCmds = files.map(f => {
    const b64 = Buffer.from(f.content).toString('base64');
    return `echo '${b64}' | base64 -d > ${f.name}`;
  }).join(' && ');

  const mainFile = files.find(f => f.name.startsWith('main'))?.name || files[0].name;

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
    await ensureImageExists(docker, dockerImg);

    container = await docker.createContainer({
      Image: dockerImg,
      Cmd: executionCmd,
      Env: ["FORCE_COLOR=0"],
      Tty: true,
      HostConfig: {
        Memory: 128 * 1024 * 1024,
        NetworkMode: "none"
      }
    });

    await container.start();

    let timer: NodeJS.Timeout;
    const timeoutLimit = 10000;

    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("Execution timed out (Limit: 10 seconds)."));
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
});

app.get('/containers', async (req, res): Promise<void> => {
  try {
    const containers = await docker.listContainers({ all: true });
    const activeRunners = containers.filter(container =>
      container.Image.includes('node') || container.Image.includes('python') || container.Image.includes('alpine'));

    res.status(200).json(activeRunners);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch containers', error: error.message });
  }
});

app.delete('/containers/:id', async (req, res): Promise<void> => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.remove({ force: true });

    res.status(200).json({ message: `Container ${req.params.id} destroyed.` });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to destroy container', error: error.message });
  }
});

app.listen(port, () => console.log(`Runner Service listening on http://localhost:${port}`));
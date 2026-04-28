import express from 'express';
import Docker from 'dockerode';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 5000;
const docker = new Docker();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

interface ExecutionRequest {
  code: string;
  language: 'python' | 'cpp' | 'javascript';
}

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
  const { code, language } = req.body as ExecutionRequest;

  if (!code || !language) {
    res.status(400).json({ message: "Error: please provide both code and language." });
    return;
  }

  let dockerImg: string = "";
  let executionCmd: Array<string> = [];

  if (language === 'python') {
    dockerImg = 'python:3.9-alpine';
    executionCmd = ['python', '-c', code];
  } else if (language === 'javascript') {
    dockerImg = 'node:18-alpine';
    executionCmd = ['node', '-e', code];
  } else if (language === 'cpp') {
    dockerImg = 'frolvlad/alpine-gxx';
    const base64Code = Buffer.from(code).toString('base64');
    executionCmd = ['sh', '-c', `echo '${base64Code}' | base64 -d > main.cpp && g++ main.cpp -o main && ./main`];
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
    const output = logs.toString('utf8').trim();

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
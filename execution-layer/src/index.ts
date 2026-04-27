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
  return new Promise((resolve, reject) => {
    console.log(`Checking image: ${imageName}...`);
    docker.pull(imageName, (err: any, stream: any) => {
      if (err) return reject(err);
      
      docker.modem.followProgress(stream, onFinished, onProgress);

      function onFinished(err: any, output: any) {
        if (err) return reject(err);
        console.log(`Image ${imageName} is ready.`);
        resolve();
      }

      function onProgress(event: any) {
        
      }
    });
  });
}

app.post('/api/execute', async (req, res): Promise<void> => {
  
  if (req.cookies.ide_token) {
    res.status(401).json({ message: "Unauthorized: no valid JWT detected" });
    return;
  }

  const { code, language } = req.body as ExecutionRequest;

  if (!code || !language) {
    res.status(400).json({ message: "Error: please provide both code and language." });
    return;
  };

  console.log(`Received ${language} execution request.`);

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
    executionCmd = ['sh', '-c', `echo '${code.replace(/'/g, "'\\''")}' > main.cpp && g++ main.cpp -o main && ./main`];
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
      Tty: false,
      HostConfig: {
        Memory: 128 * 1024 * 1024,
        NetworkMode: "none"
      }
    })

    await container.start();

    const timeoutLimit = 10000;
    let timedOut = false;

    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Execution timed out (Limit: 10 seconds)."));
      }, timeoutLimit);
    });

    await Promise.race([
      container.wait(),
      timeoutPromise
    ]);

    if (timedOut) return;

    const logs = await container.logs({ stdout: true, stderr: true });
    const output = logs.toString('utf8').replace(/[\x00-\x1F\x7F]/g, "").trim();

    res.json({ output });

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: `Error: ${error.message}` });
  } finally {
    if (container) {
      console.log("Cleanup phase initiated.");
      try {
        await container.remove({ force: true });
        console.log("Container removed successfully.");
      } catch (cleanupError) {
        console.error("Failed to cleanup container:", cleanupError);
      }
    }
  }
});

app.listen(port, () => console.log(`Runner Service listening on http://localhost:${port}`));
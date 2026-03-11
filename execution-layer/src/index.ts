import express from 'express';
import Docker from 'dockerode';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;

const docker = new Docker();

app.use(cors());
app.use(express.json());

interface ExecutionRequest {
  code: string;
  language: 'python' | 'cpp' | 'javascript';
}

app.post('/execute', async (req, res): Promise<void> => {
  const { code, language } = req.body as ExecutionRequest;

  if (!code || !language) {
    res.status(400).json({ message: "Error: please provide both code and language." });
    return;
  };

  console.log(`[Execution Layer] Received ${language} execution request.`);

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

    await Promise.race([
      container.wait(),
      setTimeout(() => {
        timedOut = true;
        throw new Error("Error: Execution timed out (Limit: 10 seconds).");
      }, timeoutLimit)
    ]);

    if (timedOut) return;

    const logs = await container.logs({ stdout: true, stderr: true });
    const output = logs.toString('utf8').replace(/[\x00-\x1F\x7F]/g, "").trim();

    res.json({ output });

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: `Error: ${error.message}` });
  } finally {
    try {
      console.log("Error: Cleanup phase initiated.");

    } catch (cleanupError) {
      console.error("Error: Failed to cleanup container:", cleanupError);
    }
  }
});

app.listen(port, () => console.log(`Runner Service listening on http://localhost:${port}`));
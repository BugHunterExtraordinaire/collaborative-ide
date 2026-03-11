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

  const container = await docker.createContainer({
    Image: dockerImg,
    Cmd: executionCmd,
    Tty: false,
    HostConfig: {
      Memory: 128 * 1024 * 1024,
      NetworkMode: "none"
    }
  })

  try {
    
  } catch (error) {
     
  } finally {

  }
});
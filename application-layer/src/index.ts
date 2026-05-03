import express from 'express';
import http from 'http';
import * as Y from 'yjs';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import cookieParser from 'cookie-parser';

import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';
import { Request, Response } from 'express';

import connectDB from './database/connect';

import authRouter from './routes/auth';
import sessionRouter from './routes/session';
import systemRouter from './routes/system';

import Session from './models/Session';
import OperationLog from './models/OperationLog';
import ExecutionLog from './models/ExecutionLog';

import { authenticateUser, handleError } from './middleware/';

const { setupWSConnection, getYDoc } = require('y-websocket/bin/utils');

dotenv.config({
  quiet: true,
})

const app = express();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/system', systemRouter);

app.post('/api/execute', authenticateUser, async (req: Request, res: Response) => {
  const { files, language, sessionId } = req.body; 
  
  const username = req.user?.username || 'Unknown'; 
  const startTime = performance.now();
  let finalOutput = '';
  let execStatus = 'Success';

  try {
    const runnerResponse = await axios.post('http://localhost:5000/execute', { files, language });
    
    finalOutput = runnerResponse.data.output;
    res.status(200).json(runnerResponse.data);

  } catch (error: any) {
    console.error('Execution proxy failed:', error.message);
    finalOutput = error.response?.data?.message || 'Execution service unavailable.';
    execStatus = finalOutput.includes('timed out') ? 'Timeout' : 'Error';
    res.status(500).json({ message: finalOutput });

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
});

app.use(handleError);

const port = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  }
});

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis Pub/Sub Adapter connected.');
}).catch((err) => {
  console.error('Redis connection failed. Is Redis running?', err.message);
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;

  if (pathname && pathname.startsWith('/yjs/')) {
    wss.handleUpgrade(request, socket as any, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

subClient.subscribe('yjs-updates', (message) => {
  try {
    const { sessionId, updateArray } = JSON.parse(message);
    const ydoc = getYDoc(sessionId, false);

    const updateBuffer = new Uint8Array(updateArray);
    Y.applyUpdate(ydoc, updateBuffer, 'redis');
  } catch (err) {
    console.error('Error applying Redis Yjs update:', err);
  }
});

subClient.subscribe('yjs-awareness', (message) => {
  try {
    const { sessionId, awarenessArray } = JSON.parse(message);
    const ydoc = getYDoc(sessionId, false);
    const awareness = (ydoc as any).awareness;

    if (awareness) {
      const updateBuffer = new Uint8Array(awarenessArray);
      applyAwarenessUpdate(awareness, updateBuffer, 'redis');
    }
  } catch (err) {
    console.error('Error applying Redis Awareness update:', err);
  }
});

wss.on('connection', (ws: WebSocket, req: any) => {
  const docName = req.url.slice(5).split('?')[0];
  console.log(`CRDT connection established for session: ${docName}`);

  const ydoc = getYDoc(docName, false);

  if (!(ydoc as any).hasDatabaseWired) {
    (ydoc as any).hasDatabaseWired = true;

    ydoc.on('update', async (update: Uint8Array, origin: any) => {
      const updateDeltaBuffer = Buffer.from(update);
      const fullStateBuffer = Buffer.from(Y.encodeStateAsUpdate(ydoc));

      if (origin !== 'redis' && origin !== 'db-load') {
        const payload = JSON.stringify({
          sessionId: docName,
          updateArray: Array.from(update)
        });
        pubClient.publish('yjs-updates', payload);
      }

      if (origin !== 'db-load') {
        try {
          await Session.findOneAndUpdate(
            { sessionId: docName },
            { state: fullStateBuffer },
            { upsert: true }
          );

          await OperationLog.create({
            sessionId: docName,
            operationData: updateDeltaBuffer
          });
        } catch (saveErr) {
          console.error('Error saving keystroke to MongoDB:', saveErr);
        }
      }
    });

    const awareness = (ydoc as any).awareness;
    if (awareness) {
      awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
        if (origin !== 'redis') {
          const changedClients = added.concat(updated).concat(removed);
          const awarenessUpdate = encodeAwarenessUpdate(awareness, changedClients);

          const payload = JSON.stringify({
            sessionId: docName,
            awarenessArray: Array.from(awarenessUpdate)
          });
          pubClient.publish('yjs-awareness', payload);
        }
      });
    }

    Session.findOne({ sessionId: docName }).then(session => {
      if (session && session.state) {
        Y.applyUpdate(ydoc, new Uint8Array(session.state), 'db-load');
        console.log(`Loaded historical state for session: ${docName}`);
      }
    }).catch(err => console.error('Error loading from MongoDB:', err));
  }

  setupWSConnection(ws, req, { docName });
});

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-session', async (sessionId, username) => {
    socket.join(sessionId);

    try {
      const session = await Session.findOne({ sessionId: sessionId });
      
      if (session && session.chatHistory) {
        socket.emit('chat-history', session.chatHistory);
      } else {
        socket.emit('chat-history', []);
      }
    } catch (err) {
      console.error("Database error fetching chat history");
    }

    socket.to(sessionId).emit('user-joined', { username });
  });

  socket.on('instructor-execution', (data: { sessionId: string, output: string }) => {
    socket.to(data.sessionId).emit('receive-execution', { 
      sessionId: data.sessionId, 
      output: data.output 
    });
  });

  socket.on('student-execution', (data: { sessionId: string, output: string }) => {
    socket.to(data.sessionId).emit('receive-execution', { 
      sessionId: data.sessionId, 
      output: data.output 
    });
  });

  socket.on('send-message', async (data) => {
    const { sessionId, message, username } = data;
    const timestamp = new Date().toISOString();

    io.to(sessionId).emit('receive-message', { username, message, timestamp });

    try {
      await Session.findOneAndUpdate(
        { sessionId: sessionId },
        { 
          $push: { 
            chatHistory: { username, message, timestamp } 
          } 
        }
      );
    } catch (err) {
      console.error("Failed to save chat message to database:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(port, async () => {
  try {
    await connectDB(process.env.MONGO_URI as string);
    console.log(`API & Synchronization Cluster listening on http://localhost:${port}`);
  } catch (error) {

  }
});
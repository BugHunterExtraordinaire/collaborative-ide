import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import * as Y from 'yjs';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import connectDB from './database/connect';
import authRouter from './routes/auth';
import Session from './models/Session';
const { setupWSConnection, getYDoc } = require('y-websocket/bin/utils');

dotenv.config({
  quiet: true,
})

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

const port = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
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

wss.on('connection', async (ws: WebSocket, req: any) => {
  const docName = req.url.slice(5).split('?')[0]; 
  console.log(`CRDT connection established for session: ${docName}`);
  
  setupWSConnection(ws, req, { docName }); 

  const ydoc = getYDoc(docName, false);

  if (!(ydoc as any).hasDatabaseWired) {
    (ydoc as any).hasDatabaseWired = true; 

    try {
      const session = await Session.findOne({ session_id: docName });
      if (session && session.state) {
        Y.applyUpdate(ydoc, new Uint8Array(session.state));
        console.log(`Loaded historical state for session: ${docName}`);
      } else {
        console.log(`Created fresh session for: ${docName}`);
      }

      ydoc.on('update', async () => {
        try {
          const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
          await Session.findOneAndUpdate(
            { session_id: docName },
            { state },
            { upsert: true }
          );
        } catch (saveErr) {
          console.error('Error saving keystroke:', saveErr);
        }
      });

    } catch (loadErr) {
      console.error('Error loading from MongoDB:', loadErr);
    }
  }
});

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-session', (sessionId: string, username: string) => {
    socket.join(sessionId);
    console.log(`User '${username}' joined session: ${sessionId}`);
    
    socket.to(sessionId).emit('user-joined', { username, socketId: socket.id });
  });

  socket.on('send-message', (data: { sessionId: string, message: string, username: string }) => {
    io.to(data.sessionId).emit('receive-message', {
      username: data.username,
      message: data.message,
      timestamp: new Date().toISOString()
    });
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
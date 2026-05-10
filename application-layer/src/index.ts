import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import connectDB from './database/connect';

import { config } from './config/env';

import { setupYjsWebSocket } from './websockets/yjsManager';
import { setupSocketIO } from './sockets/socketManager';

import { handleError } from './middleware/';

import authRouter from './routes/auth';
import sessionRouter from './routes/session';
import systemRouter from './routes/system';
import executeRouter from './routes/execute';

dotenv.config({ quiet: true });

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}));;

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/system', systemRouter);
app.use('/api/v1/execute', executeRouter);

app.use(handleError);

server.listen(config.PORT, async () => {
  try {
    await connectDB(config.MONGODB_URL);
    await setupSocketIO(server);
    await setupYjsWebSocket(server);
    console.log(`API & Synchronization Cluster listening on http://localhost:${config.PORT}`);
  } catch (error) {
    console.error("Error: " + error);
  }
});
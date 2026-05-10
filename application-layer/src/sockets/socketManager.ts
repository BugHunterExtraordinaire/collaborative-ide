import http from 'http';

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

import { config } from '../config/env';

import { registerRoomEvents } from './events/roomEvents';
import { registerChatEvents } from './events/chatEvents';
import { registerExecutionEvents } from './events/executionEvents';

export const setupSocketIO = async (server: http.Server) => {

  const io = new Server(server, {
    cors: {
      origin: config.CLIENT_URL,
      credentials: true,
    }
  });

  const pubClient = createClient({ url: config.REDIS_URL });
  const subClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis Pub/Sub Adapter connected for Socket.IO.');
  } catch (err: any) {
    console.error('Redis connection failed. Is Redis running?', err.message);
  }

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    registerRoomEvents(socket);
    registerChatEvents(io, socket);
    registerExecutionEvents(socket);
  });
};
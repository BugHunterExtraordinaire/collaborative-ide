import http from 'http';
import WebSocket from 'ws';
import * as Y from 'yjs';

import { createClient } from 'redis';
import { applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';

import Session from '../models/Session';
import OperationLog from '../models/OperationLog';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setupWSConnection, getYDoc } = require('y-websocket/bin/utils');

export const setupYjsWebSocket = async (server: http.Server) => {
  const pubClient = createClient({ url: 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();
  
  await Promise.all([pubClient.connect(), subClient.connect()]);

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
};
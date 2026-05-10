import { Server, Socket } from 'socket.io';

import Session from '../../models/Session';

export const registerChatEvents = (io: Server, socket: Socket) => {
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
};
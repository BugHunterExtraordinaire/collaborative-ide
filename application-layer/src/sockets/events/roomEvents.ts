import { Socket } from 'socket.io';

import Session from '../../models/Session';

export const registerRoomEvents = (socket: Socket) => {
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

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
};
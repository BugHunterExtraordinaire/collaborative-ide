import { Socket } from 'socket.io';

import Session from '../../models/Session';

export const registerRoomEvents = (socket: Socket) => {
  socket.on('join-session', async (sessionId, user) => {
    socket.join(sessionId);

    socket.data.sessionId = sessionId;
    socket.data.user = user;

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

    socket.to(sessionId).emit('user-joined', { username: user.username });
  });

  socket.on('disconnect', () => {
    const { sessionId, user } = socket.data;
    
    if (sessionId && user && user.role !== "System Administrator") {
      socket.to(sessionId).emit('user-left', { username: user.username });
    }
  });
};
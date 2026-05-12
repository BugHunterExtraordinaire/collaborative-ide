import { Socket } from 'socket.io';

export const registerExecutionEvents = (socket: Socket) => {
  socket.on('broadcast-execution', (data: { sessionId: string, output: string }) => {
    socket.to(data.sessionId).emit('receive-execution', { 
      sessionId: data.sessionId, 
      output: data.output 
    });
  });
};
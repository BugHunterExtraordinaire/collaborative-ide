import { Socket } from 'socket.io';

export const registerExecutionEvents = (socket: Socket) => {
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
};
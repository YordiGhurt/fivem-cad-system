import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketServer(server: HTTPServer): SocketIOServer {
  if (!io) {
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });
  }
  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function emitEvent(event: string, data: unknown): void {
  if (io) {
    io.emit(event, data);
  }
}

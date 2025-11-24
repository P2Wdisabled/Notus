import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeSocketServer } from '@/lib/paper.js/socket-server';
import type { Server as HTTPServer } from 'http';

type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: HTTPServer & { io?: any };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(_req: NextApiRequest, res: NextApiResponseServerIO) {
  console.log('🔌 Socket API route called');
  
  if (!res.socket.server.io) {
    const httpServer: HTTPServer = res.socket.server as any;
    const io = initializeSocketServer(httpServer);
    res.socket.server.io = io;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}



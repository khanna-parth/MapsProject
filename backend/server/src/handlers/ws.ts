import { WebSocketServer, WebSocket } from 'ws';
import pool from '../database/models/pool';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import ROUTES from '../routes/routes';
import { checkValidString } from '../util/util';
import db from '../database/models/index';

/**
 * Sets up the WebSocket server for party communication.
 * @param server - The HTTP server to attach the WebSocket server to.
 */
export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const userID = (ws as any).userID;
    const partyID = (ws as any).partyID;

    ws.send(`Connected to ${partyID}`);

    ws.on('message', (message) => {
      const party = pool.partyExists(partyID);
      if (party) {
        const jsonMessage = {
          userID,
          content: message.toString(),
          timestamp: new Date().toISOString(),
        };
        party.broadcast(JSON.stringify(jsonMessage), userID);
      } else {
        ws.send(JSON.stringify({ error: 'Error sending message' }));
        ws.close();
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket connection for user ${userID} closed`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  server.on('upgrade', async (req: IncomingMessage, socket, head) => {
    const { pathname, searchParams } = new URL(req.url || '', `http://${req.headers.host}`);
    if (pathname === ROUTES.JOIN_PARTY) {
      const partyID = searchParams.get('partyID') || '';
      const userID = searchParams.get('userID') || '';

      if (!checkValidString(partyID) || !checkValidString(userID)) {
        socket.destroy();
        return;
      }

      const validUser = await db.User.findByPk(userID);
      if (!validUser) {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        (ws as any).userID = userID;
        (ws as any).partyID = partyID;
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });
}

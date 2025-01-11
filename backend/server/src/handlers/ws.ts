import { WebSocketServer, WebSocket } from 'ws';
import { User } from '../models/user.js';
import { pool } from '../models/pool.js';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { JOIN_PARTY_ROUTE } from '../routes/routes.js';
import { checkValidString, generateUniqueId } from '../util/util.js';

export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        const userID = (ws as any).userID;
        const partyID = (ws as any).partyID;

        ws.send(`Connected to ${partyID}`);

        ws.on('message', (message) => {
            const party = pool.partyExists(partyID);
            if (party) {
                party.broadcast(message.toString(), userID);
            } else {
                ws.send("Error sending message");
                ws.close();
            }
        });

        ws.on('close', () => {
            // console.log('WebSocket connection closed');
        });

        ws.on('error', (error) => {
            console.log('WebSocket error:', error);
        });
    });

    server.on('upgrade', (request: IncomingMessage, socket: any, head: Buffer) => {
        console.log(`Received upgrade request for: ${request.url}`);
        const { pathname, searchParams } = new URL(request.url || '', `http://${request.headers.host}`);

        if (pathname === JOIN_PARTY_ROUTE) {
          const partyID = (request.headers['X-Party-ID'] || searchParams.get('partyID') || '').toString();
          const userID = (request.headers['X-User-ID'] || searchParams.get('userID') || '').toString(); 
          console.log(`PartyID received: ${partyID}`);
          console.log(`UserID received: ${userID}`);

          if (!checkValidString(partyID)) {
              console.log("/join request without partyID");
              socket.destroy(); 
              return;
          }

          if (!checkValidString(userID)) {
            console.log("/join request without userID");
            socket.destroy(); 
            return;
          }

          const validUser = pool.userExistsByID(userID)
          if (!validUser) {
            console.log("/join request without valid userID")
            socket.destroy();
            return;
          }

          const party = pool.partyExists(partyID);
          if (!party) {
              console.log("/join request to a non-existent party");
              socket.destroy();
              return;
          }

          const existing = pool.isUserConnected(userID)
          if (existing) {
            console.log(`Disconnecting user from existing party: ${existing.partyID}`)
            pool.disconnectUser(userID);
            existing.removeUser(userID);
          } else {
            console.log(`Did not find existing party for user: ${userID}`)
          }

          wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
              (ws as any).partyID = partyID;
              (ws as any).userID = userID;

              wss.emit('connection', ws, request);

              if (party) {
                const user = pool.userExistsByID(userID);
                if (user) {
                  user.setConnection(ws);
                  const connected = pool.connectUser(user, partyID)
                  if (connected) {
                    console.log(`Added user ${user.userID} to party ${partyID}`)
                  } else {
                    console.log("Failed to add user to party")
                  }
                } else {
                  console.log("Websocket refused, no valid user.")
                  socket.destroy();
                }
              } else {
                  console.log('Party not found');
                  socket.destroy();
              }
          });

        } else {
            console.log('Path not recognized for WebSocket upgrade');
            console.log(`USER ENTERED: ${pathname}. Expected: ${JOIN_PARTY_ROUTE}`)
            socket.destroy();
        }
    });
}

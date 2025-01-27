import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { pool } from '../models/pool.js';
import { checkValidString } from '../util/util.js';
import { UserDB } from '../db/dbuser.js';

export function setupSocketIO(server: HttpServer) {
    const io = new SocketIOServer(server, {
        // path: "/party/join",
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connect', async (socket) => {
        console.log('New connection:', socket.handshake.query);
        let userID = socket.handshake.query.userID;
        let partyID = socket.handshake.query.partyID;

        if (!userID) {
            socket.emit('error', `userID not properly provided: '${userID}'`)
            socket.disconnect()
            return
        }

        if (!partyID) {
            socket.emit('error', `partyID not properly provided: '${partyID}'`)
            socket.disconnect()
            return
        }

        userID = userID.toString()
        partyID = partyID.toString()

        if (!checkValidString(userID)) {
            socket.emit('error', `userID not properly provided: '${userID}'`)
            socket.disconnect()
            return
        }

        if (!checkValidString(partyID)) {
            socket.emit('error', `partyID not properly provided: '${partyID}'`)
            socket.disconnect()
            return
        }

        const validUser = await UserDB.dbFindID(userID);
        if (!validUser) {
            console.log("/join request without valid userID");
            socket.disconnect();
            return;
        }

        const party = pool.partyExists(partyID);
        if (!party) {
            console.log("/join request to a non-existent party");
            socket.disconnect();
            return;
        }

        const existing = pool.isUserConnected(userID);
        if (existing) {
            console.log(`Disconnecting user from existing party: ${existing.partyID}`);
            pool.disconnectUser(userID, "You were disconnected because you joined from somewhere else");
            existing.removeUser(userID);
        } else {
            console.log(`Did not find existing party for user: ${userID}`);
        }

        validUser.setConnection(socket);
        const connected = pool.connectUser(validUser, partyID)

        console.log(`Connected ${userID} to ${partyID}!`)

        socket.emit('connected', `Connected to ${partyID}`);


        socket.on('message', (message: string) => {
            const party = pool.partyExists(partyID);
            if (party) {
                const jsonMessage = {
                    userID,
                    content: message,
                    timestamp: new Date().toISOString(),
                };
                party.broadcast(JSON.stringify(jsonMessage), userID);
            } else {
                const errorMessage = { error: "Error sending message" };
                socket.emit('error', errorMessage);
                socket.disconnect();
            }
        });

        socket.on('disconnect', () => {
            console.log(`User ${userID} disconnected from party ${partyID}`);
        });

        socket.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });
    });
}
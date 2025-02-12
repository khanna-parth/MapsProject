import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { pool } from '../models/pool';
import { checkValidString } from '../util/util';
import { UserDB } from '../db/dbuser';
import { PartyDB } from '../db/dbparty';

export function setupSocketIO(server: HttpServer) {
    const io = new SocketIOServer(server, {
        path: "/party/join",
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    
    io.on('connect', async (socket) => {
        console.log('SocketIO new connection triggered')
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

        const party = await pool.partyExists(partyID);
        if (!party) {
            pool.listPool();
            console.log("/join request to a non-existent party");
            socket.disconnect();
            return;
        }

        const access = party.invited.find((invitedUsers) => invitedUsers.userID == userID);
        if (!access && party.host.userID != userID) {
            console.log(party.invited)
            console.log(party.connected)
            console.log(party.host)
            console.log(`${userID} has not been invited to party ${partyID}. Denying request`);
            socket.disconnect();
            return;
        }

        console.log(`[Party] ${userID} was found in invited users.`)

        const existingParty = pool.isUserConnected(userID);
        if (existingParty) {
            console.log(`Disconnecting ${userID} from existing party: ${existingParty.partyID}`);
            pool.disconnectUser(userID, "You were disconnected because you joined from somewhere else");
            existingParty.removeUser(userID);
        } else {
            console.log(`Did not find existing party for user: ${userID}`);
        }

        const joinResult = await PartyDB.joinParty(partyID, validUser);
        if (!joinResult.success) {
            socket.emit('error', joinResult.error);
            socket.disconnect();
            return;
        }

        validUser.setConnection(socket, socket.id);
        await pool.connectUser(validUser, partyID, socket.id)

        console.log(`[Party]: Connected user ${userID} to party ${partyID}!`)

        socket.emit('connected', `Connected to ${partyID}`);


        socket.on('message', async (message: string) => {
            const party = await pool.partyExists(partyID);
            if (party) {
                const jsonMessage = {
                    userID,
                    content: message,
                    timestamp: new Date().toISOString(),
                };
                party.broadcast('INTERNAL', JSON.stringify(jsonMessage), userID, true);
            } else {
                const errorMessage = { error: "Error sending message" };
                socket.emit('error', errorMessage);
                socket.disconnect();
            }
        });

        socket.on('disconnect', async () => {
            console.log(`User ${userID} disconnected from party ${partyID}`);
            pool.disconnectBySocketID(socket.id)
            await PartyDB.leaveParty(partyID, validUser);
        });

        socket.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });
    });
}
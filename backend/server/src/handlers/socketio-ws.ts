import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { pool } from '../models/pool';
import { checkValidString, VerifyLocationData, generateUniqueId } from '../util/util';
import { UserDB } from '../db/dbuser';
import { PartyDB } from '../db/dbparty';
import { PartyPolicy } from '../models/deps/party-deps';
import { SharedDestination } from '../models/geolocation';

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
            console.log("[Party] /join request to a non-existent party");
            socket.disconnect();
            return;
        }

        const access = party.invited.find((invitedUsers) => invitedUsers.userID == userID);
        if (party.policy == PartyPolicy.CLOSED) {
            if (!access && party.host.userID != userID) {
                console.log("Invited")
                console.log(party.invited.map((user) => user.username))
                console.log("Connected:")
                console.log(party.connected.values().map((user) => user.username))
                console.log("Host:")
                console.log(party.host.username)
                console.log(`${userID} has not been invited to party ${partyID}. Denying request`);
                socket.disconnect();
                return;
            }
        }   

        console.log(`[Party] ${userID} was found in invited users.`)

        const existingParty = pool.isUserConnected(userID);
        if (existingParty) {
            if (existingParty.partyID === partyID) {
                console.log(`[Party] Join request to party ${partyID} where user is present. Denying`);
                socket.disconnect();
                return;
            }
            console.log(`[Party] Disconnecting ${userID} from existing party: ${existingParty.partyID}`);
            pool.disconnectUser(userID, "You were disconnected because you joined from somewhere else");
            existingParty.broadcast("connections", `${validUser.username} disconnected`, 'SYSTEM', true);
            existingParty.removeUser(userID);
        } else {
            console.log(`[Party] Check passed: user is currently not connected in any parties`)
        }

        const joinResult = await PartyDB.joinParty(partyID, validUser);
        if (!joinResult.success) {
            console.log(`[Party] INTERNAL ERROR: DATABASE COULD NOT BE UPDATED TO INCLUDE USER JOIN`)
            socket.emit('error', joinResult.error);
            socket.disconnect();
            return;
        }

        validUser.setConnection(socket, socket.id);
        await pool.connectUser(validUser, partyID, socket.id)

        console.log(`[Party]: Connected user ${userID} to party ${partyID}!`)
        
        socket.emit("connection", `You joined party ${partyID}`)
        party.broadcast('connections', `${validUser.username} joined`, '', true);

        socket.on('add-destination', async (destination: Omit<SharedDestination, 'id' | 'addedAt'>) => {
            const party = await pool.partyExists(partyID);
            if (party) {
                const newDestination: SharedDestination = {
                    ...destination,
                    id: generateUniqueId(),
                    addedAt: new Date()
                };
                await party.addSharedDestination(newDestination);
            }
        });

        socket.on('remove-destination', async (destinationId: string) => {
            const party = await pool.partyExists(partyID);
            if (party) {
                await party.removeSharedDestination(destinationId);
            }
        });

        socket.on('set-current-destination', async (destinationId: string) => {
            const party = await pool.partyExists(partyID);
            if (party) {
                await party.setCurrentDestination(destinationId);
            }
        });

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

        socket.on('location', async (locationData) => {
            const validLocationData = VerifyLocationData(locationData);
            if (validLocationData) {
            party.broadcast('location', JSON.stringify(locationData), validUser.username, false);
            // party.broadcast('location', JSON.stringify(locationData), validUser.username, false, true);
            validUser.coordinates = locationData;
            // console.log(`[Party] Received location from ${userID}:`, locationData);
            } else {
                console.log(`[Party -> location] Invalid data ${locationData} from ${userID}`)
            }
        });

        socket.on('disconnect', async () => {
            // console.log(`User ${userID} disconnected from party ${partyID}`);
            console.log(`[Party] User ${userID} disconnected from party ${partyID}`);
            pool.disconnectBySocketID(socket.id)
            party.broadcast('connections', `${validUser.username} disconnected`, validUser.username, true, false);
            await PartyDB.leaveParty(partyID, validUser);
        });

        socket.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });
    });
}
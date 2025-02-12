import { PartyDB } from "../db/dbparty";
import { UserDB } from "../db/dbuser";
import { Party } from "./party";
import { User } from "./user";

class Pool {
    private connectionPool: Map<string, Party> = new Map();
    private users: User[] = [];
    private static instance: Pool;

    private constructor() {
        this.monitor();
        // this.monitorDB();
    }

    static getInstance(): Pool {
        if (!Pool.instance) {
            Pool.instance = new Pool();
        }
        return Pool.instance;
    }

    registerUser(user: User): void {
        this.users.push(user);
    }

    async userExistsByID(userID: string): Promise<User | null> {
        const user = this.users.find(user => user.userID === userID)
        if (user) return user;

        const dbUser = await UserDB.dbFindID(userID);
        if (dbUser) return dbUser;
        return null;
    }
    
    async userExistsByName(username: string): Promise<User | null> {
        const user = this.users.find(user => user.username === username)
        if (user) return user;

        const dbUser = await UserDB.dbFindUsername(username);
        if (dbUser) {
            this.registerUser(dbUser);
            return dbUser;
        }
        return null;
    }

    registerParty(partyID: string, party: Party): void {
        if (this.connectionPool.has(partyID)) {
            throw new Error("Cannot create party. Already exists");
        }
        this.connectionPool.set(partyID, party);
        console.log(`[Pool] registered ${partyID} in internal map`)
    }

    async removeParty(partyID: string): Promise<void> {
        this.connectionPool.delete(partyID);
        await PartyDB.deleteParty(partyID);
    }

    async partyExists(partyID: string): Promise<Party | null> {
        const party = this.connectionPool.get(partyID)
        if (party) {
            console.log(`PartyExists found ${partyID} in internal map`)
            return party
        }

        const dbParty = await PartyDB.getParty(partyID)
        if (dbParty) {
            console.log(`[Pool] Found ${partyID} in DB`)
            this.registerParty(partyID, dbParty)
            return dbParty
        }
        return null;
    }

    listPool(): Party[] {
        return Array.from(this.connectionPool.values());
    }

    hasElapsedCheck(partyEmptyTime: number, intervalSeconds: number): boolean {
        const currentTime = Date.now();
        const timeDiff = currentTime - partyEmptyTime;
        return timeDiff > (intervalSeconds * 1000);
    }

    monitor() {
        setInterval(() => {
            this.connectionPool.forEach((party) => {
                // console.log(party.connected);
                if (party.connected.entries().toArray().length === 0 && this.hasElapsedCheck(party.lastEmpty, 30)) {
                    this.removeParty(party.partyID);
                    console.log(`Party ${party.partyID} was deleted for inactivity`)
                }
            });
        }, 3000);
    }

    monitorDB() {
        setInterval(() => {
            PartyDB.clean();
        }, 30000);
    }

    broadcastAllParties(message: string): void {
        this.connectionPool.forEach((party) => {
            party.connected.forEach((user) => {
                if (user.ws) {
                    if (user.ws.connected === true) {
                        user.ws.send(message);
                    }
                }
            });
        });
    }

    async connectUser(user: User, partyID: string, socketID: string): Promise<{connected: boolean, error?: string}> {
        const party = await this.partyExists(partyID)
        if (party) {
            party.addUser(user, socketID)
            return {connected: true};
        } else {
            console.log(`Did not find partyID: ${partyID} to connect ${user.userID} to`)
            return {connected: false, error: `Party of ID ${partyID} does not exist`}
        }
    }

    disconnectUser(userID: string, msg: string | undefined): void {
        this.connectionPool.forEach((party) => {
            const user = party.getUser(userID);
            if (user) {
                if (user.ws && msg) {
                    user.ws.emit("ALERT", msg)
                }
                user.disconnectConn();
                party.removeUser(userID);
            }
        });
    }

    disconnectBySocketID(socketID: string): boolean {
        this.connectionPool.forEach((party) => {
            const user = party.getUserBySocket(socketID)
            if (user) {
                user.disconnectConn()
                party.removeUser(socketID)
                return true
            }
        })
        return false;
    }

    isUserConnected(userID: string): Party | null {
        for (const [_, party] of this.connectionPool.entries()) {
            if (party.userExists(userID)) {
                return party;
            }
        }
        return null;
    }
}

export const pool = Pool.getInstance();

import { Party } from "./party";
import { User } from "./user";

class Pool {
    private connectionPool: Map<string, Party> = new Map();
    private users: User[] = [];
    private static instance: Pool;

    private constructor() {
        this.monitor();
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

    userExistsByID(userID: string): User | null {
        const user = this.users.find(user => user.userID === userID)
        if (user) {
            return user;
        }
        return null;
    }
    
    userExistsByName(username: string): User | null {
        const user = this.users.find(user => user.username === username)
        if (user) {
            return user;
        }
        return null;
    }

    registerParty(partyID: string, party: Party): void {
        if (this.connectionPool.has(partyID)) {
            throw new Error("Cannot create party. Already exists");
        }
        this.connectionPool.set(partyID, party);
    }

    removeParty(partyID: string): void {
        this.connectionPool.delete(partyID);
    }

    partyExists(partyID: string): Party | null {
        const party = this.connectionPool.get(partyID)
        if (party) {
            return party;
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
                if (party.connected.entries().toArray().length === 0 && this.hasElapsedCheck(party.lastEmpty, 100)) {
                    this.removeParty(party.partyID);
                    console.log(`Party ${party.partyID} was deleted for inactivity`)
                }
            });
        }, 3000);
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

    connectUser(user: User, partyID: string, socketID: string): {connected: boolean, error?: string} {
        const party = this.partyExists(partyID)
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

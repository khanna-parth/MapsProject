import { Party } from "./party";
import { User } from "./user";

class Pool {
    private connectionPool: Map<string, Party> = new Map();
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

    register(partyID: string, party: Party): void {
        if (this.connectionPool.has(partyID)) {
            throw new Error("Cannot create party. Already exists");
        }
        this.connectionPool.set(partyID, party);
    }

    remove(partyID: string): void {
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
                if (party.connected.length === 0 && this.hasElapsedCheck(party.lastEmpty, 30)) {
                    this.remove(party.partyID);
                    console.log(`Party ${party.partyID} was deleted for inactivity`)
                }
            });
        }, 3000);
    }

    broadcast(message: string): void {
        this.connectionPool.forEach((party) => {
            party.connected.forEach((user) => {
                if (user.ws.readyState === user.ws.OPEN) {
                    user.ws.send(message);
                }
            });
        });
    }

    connectUser(user: User, partyID: string): {connected: boolean, error?: string} {
        const party = this.partyExists(partyID)
        if (party) {
            party.addUser(user)
            return {connected: true};
        } else {
            return {connected: false, error: `Party of ID ${partyID} does not exist`}
        }
    }

    disconnectUser(userID: string): void {
        this.connectionPool.forEach((party) => {
            const user = party.getUser(userID);
            if (user) {
                user.disconnectConn();
                party.removeUser(userID);
            }
        });
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

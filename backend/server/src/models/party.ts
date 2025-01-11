import { User } from "./user"
import { insertUser } from "../db/db"

class Party {
    partyID: string
    connected: User[]
    lastEmpty: number
    constructor(partyID: string) {
        this.partyID = partyID
        this.connected = []
        this.lastEmpty = Date.now()
    }

    addUser(user: User): void {
        this.connected.push(user);
        this.checkUpdateEmpty();
    }

    removeUser(userID: string): void {
        this.connected = this.connected.filter(user => user.userID !== userID);
        this.checkUpdateEmpty()
    }

    userExists(userID: string): boolean {
        return this.connected.some(user => user.userID === userID)
    }

    getUser(userID: string): User | null {
        const user = this.connected.find(user => user.userID === userID);
        return user || null;
    }

    checkUpdateEmpty(): void {
        if (this.connected.length == 0) {
            this.lastEmpty = Date.now();
        }
    }

    broadcast(message: string, senderID: string): void {
        this.connected.forEach((user) => {
            if (user.ws) {
                if (user.ws.readyState === WebSocket.OPEN) {
                    if (user.userID !== senderID) {
                        user.ws.send(`[${senderID}]: ${message}`);
                    } else {
                        user.ws.send(`[YOU]: ${message}`);
                    }
                }
            }
        });
    }

    toJSON() {
        return {
            connected: this.connected,
        }
    }
}

export { Party };
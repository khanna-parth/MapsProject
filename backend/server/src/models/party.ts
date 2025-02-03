import { User } from "./user"

class Party {
    partyID: string
    connectedPartially?: Partial<User>[]
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
            if (user.ws && user.ws.connected === true) {
                if (user.userID !== senderID) {
                    user.ws.send(message);
                    // user.ws.send(`[${senderID}]: ${message}`);
                } else {
                    user.ws.send(message);
                    // user.ws.send(`[YOU]: ${message}`);
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
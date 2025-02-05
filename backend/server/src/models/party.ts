import { getDirections } from "../ext/gmaps"
import { User } from "./user"

class Party {
    partyID: string
    connectedPartially?: Partial<User>[]
    connected: Map<string, User>
    invited: User[]
    lastEmpty: number
    constructor(partyID: string) {
        this.partyID = partyID
        this.connected = new Map()
        this.invited = []
        this.lastEmpty = Date.now()
    }

    invite(user: User): void {
        this.invited.push(user);
    }

    deinvite(username: string): void {
        this.invited = this.invited.filter(user => user.username !== username)
    }

    addUser(user: User, socketID: string): void {
        this.connected= this.connected.set(socketID, user)
        // this.connected.push(user);
        this.checkUpdateEmpty();
    }

    removeUser(socketID: string): void {
        this.connected.delete(socketID)
        // this.connected = this.connected.filter(user => user.userID !== userID);
        this.checkUpdateEmpty()
    }

    userExists(userID: string): boolean {
        return this.connected.get(userID) != undefined
        // return this.connected.some(user => user.userID === userID)
    }

    getUser(userID: string): User | null {
        const user = this.connected.get(userID)
        // const user = this.connected.find(user => user.userID === userID);
        return user || null;
    }

    getUserBySocket(socketID: string): User | null {
        for (let [sockID, value] of this.connected.entries()) {
            if (socketID === sockID)
                return value
        }

        return null;
    }

    checkUpdateEmpty(): void {
        if (this.connected.entries.length == 0) {
            this.lastEmpty = Date.now();
        }
        // if (this.connected.length == 0) {
        //     this.lastEmpty = Date.now();
    }

    update(): void {
        setInterval(() => {
            this.connected.forEach((user) => {
                if (user.ws) {
                    // getDirections('37.6604,121.8758', '36.9741,122.0308')
                    user.ws.emit('directions', )
                }
            })
        }, 3000);
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
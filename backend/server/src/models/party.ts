import { User } from "./user"

class Party {
    partyID: string
    connectedPartially?: Partial<User>[]
    connected: Map<string, User>
    invited: User[]
    lastEmpty: number
    constructor(partyID: string) {
        this.partyID = partyID
        this.connected = new Map<string, User>()
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
                    user.ws.emit('directions', {})
                }
            })
        }, 3000);
    }

    broadcast(broadcastChannel: string, message: string, senderID: string, systemMessage?: boolean): void {
        if (!systemMessage) { systemMessage = false }
        this.connected.forEach((user) => {
            if (user.ws && user.ws.connected === true) {
                if (!systemMessage) {
                    user.ws.emit(broadcastChannel, `${senderID}: ${message}`)
                    console.log(`${senderID} sent a message on ${broadcastChannel} channel`)
                } else {
                    user.ws.emit(broadcastChannel, `SYSTEM: ${message}`)
                    console.log(`System broadcasted a message on ${broadcastChannel} channel`)
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
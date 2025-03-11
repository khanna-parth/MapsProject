import { PartyPolicy } from "./deps/party-deps";
import { DirectionsResult, SharedDestination, SharedDestinationList } from "./geolocation";
import { User } from "./user"
import { Entity, PrimaryColumn, Column, ManyToOne, ManyToMany, JoinTable, BaseEntity, BeforeInsert } from 'typeorm';

@Entity()
class Party extends BaseEntity {
    @PrimaryColumn()
    partyID!: string;

    invited: User[] = [];
    connected: Map<string, User> = new Map();

    lastEmpty: number = Date.now();
    policy: PartyPolicy = PartyPolicy.OPEN;

    @ManyToOne(() => User, user => user.hostedParties)
    host!: User;

    @ManyToMany(() => User, user => user.parties)
    @JoinTable()
    participants!: User[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ default: true })
    isActive!: boolean;

    routes: Map<string, DirectionsResult> = new Map();
    
    @Column('simple-json', { nullable: true })
    sharedDestinations: SharedDestinationList = { destinations: [] };

    @BeforeInsert()
    setDefaults() {
        this.connected = new Map();
        this.lastEmpty = Date.now();
        this.isActive = true;
        this.sharedDestinations = { destinations: [] };
    }

    async addSharedDestination(destination: SharedDestination): Promise<void> {
        this.sharedDestinations.destinations.push(destination);
        await this.save();
        this.broadcast('shared-destinations', JSON.stringify(this.sharedDestinations), 'SYSTEM', true);
    }

    async removeSharedDestination(destinationId: string): Promise<void> {
        this.sharedDestinations.destinations = this.sharedDestinations.destinations.filter(
            d => d.id !== destinationId
        );
        await this.save();
        this.broadcast('shared-destinations', JSON.stringify(this.sharedDestinations), 'SYSTEM', true);
    }

    async setCurrentDestination(destinationId: string): Promise<void> {
        this.sharedDestinations.currentDestination = this.sharedDestinations.destinations.find(
            d => d.id === destinationId
        );
        await this.save();
        this.broadcast('shared-destinations', JSON.stringify(this.sharedDestinations), 'SYSTEM', true);
    }

    async setRoute(userID: string, route: DirectionsResult, broadcast: boolean) {
        this.routes.set(userID, route);
        if (broadcast) {
            this.broadcast('directions', JSON.stringify(route.data), 'SYSTEM', true)
        }
    }

    async invite(user: User): Promise<{invited: boolean, error?: string}> {
        if (this.invited.find((invitedUser) => invitedUser.username == user.username)) {
            return { invited: false, error: `${user.username} is already invited`};
        }
        this.invited.push(user);
        await this.save();
        return {invited: true}
    }

    async deinvite(username: string): Promise<{removed: boolean}> {
        this.invited = this.invited.filter(user => user.username !== username)
        await this.save();
        return { removed: true }
    }

    async addUser(user: User, socketID: string): Promise<void> {
        this.connected = this.connected.set(socketID, user)
        // this.connected.push(user);
        this.checkUpdateEmpty();
        await this.save();

    }

    removeUser(socketID: string): void {
        this.connected.delete(socketID)
        // this.connected = this.connected.filter(user => user.userID !== userID);
        this.checkUpdateEmpty()
    }

    userExists(userID: string): boolean {
        const found = this.connected.values().find((user) => user.userID === userID);
        if (found) {
            return true;
        }
        return false;
        // return this.connected.some(user => user.userID === userID)
    }

    userExistsBySocketID(socketID: string): boolean {
        return this.connected.get(socketID) != undefined
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
        if (this.connected.size === 0) {
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

    broadcast(broadcastChannel: string, message: string, senderID: string, systemMessage?: boolean, includeSenderID?: boolean): void {
        if (!systemMessage) { systemMessage = false }
        this.connected.forEach((user) => {
            if (user.ws && user.ws.connected === true) {
                if (!systemMessage) {
                    if (includeSenderID) {
                        user.ws.emit(broadcastChannel, `${senderID}: ${message}`)
                        console.log(`${senderID} sent a message on ${broadcastChannel} channel`)
                    } else {
                        user.ws.emit(broadcastChannel, message)
                        console.log(`${senderID} sent a message on ${broadcastChannel} channel`)
                    }
                } else {
                    user.ws.emit(broadcastChannel, `SYSTEM: ${message}`)
                    console.log(`System broadcasted a message on ${broadcastChannel} channel`)
                }
            }
        });
    }

    toJSON() {
        return {
            partyID: this.partyID,
            host: this.host?.username,
            participants: this.participants?.map(p => p.username),
            createdAt: this.createdAt,
            isActive: this.isActive,
            connected: Array.from(this.connected.values()).map(u => u.toJSONShallow())
        };
    }
}

export { Party };
import { WebSocket } from "ws";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany, JoinTable, Like, OneToMany } from 'typeorm';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { Mutex } from 'async-mutex';
import { Socket } from "socket.io";
import { Party } from "./party";


@Entity()
class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    userID: string;

    @Column({nullable: true})
    firstName: string;

    @Column({nullable: true})
    lastName: string;

    @Column({nullable: true})
    email: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column('json')
    coordinates: { long: number; lat: number };

    // ws?: WebSocket
    ws?: Socket
    wsID?: string

    sessionID?: string

    @OneToMany(() => Party, party => party.host)
    hostedParties!: Party[];

    @ManyToMany(() => Party, party => party.participants)
    @JoinTable()
    parties!: Party[];

    @ManyToMany(() => User)
    @JoinTable()
    friends?: User[];

    private userMutex: Mutex = new Mutex();

    constructor() {
        super();
        this.userID = uuidv4();
        this.username = ""
        this.firstName = ""
        this.lastName = ""
        this.email = ""
        this.password = ""
        this.coordinates = {long: 0, lat: 0}
    }

    static CreateUser(firstName: string, lastName: string, email: string, username: string, password: string): User {
        const user = new User();
        user.username = username;
        user.password = password;
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.sessionID = uuidv4();
        user.friends = [];

        return user;
    }

    async setConnection(ws: Socket, socketID: string) {
        const release = await this.userMutex.acquire();
        try {
            this.ws = ws;
            this.wsID = socketID
        } finally {
            release();
        }
    }

    disconnectConn(): boolean {
        if (this.ws) {
            if (this.ws.connected) {
                this.ws.disconnect();

            }
            return this.ws.connected == false;
        }
        return true;
    }

    async updateLocation(newLong: number, newLat: number): Promise<void> {
        const release = await this.userMutex.acquire();
        try {
            this.coordinates = {long: newLong, lat: newLat}
        } finally {
            release()
        }
    }

    async syncDB(): Promise<void> {
        try {
          await this.save();
          console.log('User saved:', this.username);
        } catch (error) {
          console.error('Error saving user:', error);
        }
    }

    toJSON() {
        return {
            username: this.username,
            userID: this.userID,
            coordinates: {
                long: this.coordinates.long,
                lat: this.coordinates.lat,
            },
            friends: this.friends ? this.friends.map((friend) => friend.username) : [],
        };
    }

    toJSONShallow() {
        return {
            username: this.username,
            userID: this.userID,
            coordinates: {
                long: this.coordinates.long,
                lat: this.coordinates.lat,
            },
        };
    }
}

export { User }
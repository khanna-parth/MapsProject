import { WebSocket } from "ws";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany, JoinTable } from 'typeorm';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';


@Entity()
class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    userID: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column('float')
    long: number;

    @Column('float')
    lat: number;

    ws?: WebSocket
    sessionID?: string

    @ManyToMany(() => User)
    @JoinTable()
    friends?: User[];

    constructor() {
        super();
        this.userID = uuidv4();
        this.username = ""
        this.password = ""
        this.long = 0;
        this.lat = 0;
    }

    static CreateUser(username: string, password: string): User {
        const user = new User();
        user.username = username;
        user.password = password;
        user.sessionID = uuidv4();
        user.friends = [];

        return user;
    }

    setConnection(ws: WebSocket) {
        this.ws = ws;
    }

    disconnectConn(): boolean {
        if (this.ws) {
            if (this.ws.OPEN) {
                this.ws.close();
            }
            return this.ws.readyState == this.ws.CLOSED;
        }
        return true;
    }

    updateLocation(long: number, lat: number): void {
        this.long = long;
        this.lat = lat;
    }

    async syncDB(): Promise<void> {
        try {
          await this.save();
          console.log('User saved:', this);
        } catch (error) {
          console.error('Error saving user:', error);
        }
    }

    toJSON() {
        return {
            username: this.username,
            userID: this.userID,
            long: this.long,
            lat: this.lat,
            friends: this.friends ? this.friends.map((friend) => friend.username) : [],
        };
    }
}

export { User }
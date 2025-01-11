import { WebSocket } from "ws";
import { insertUser } from "../db/db";
import { generateUniqueId } from "../util/util";

class User {
    userID: string
    username: string
    password: string
    ws?: WebSocket
    long: number
    lat: number
    constructor(username: string, password: string) {
        this.userID = generateUniqueId();
        this.username = username;
        this.password = password;
        this.long = 0;
        this.lat = 0;
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

    syncDB(): void {
        console.log("User syncing DB")
        // insertUser(this);
    }

    toJSON() {
        return {
            username: this.username,
            userID: this.userID,
            long: this.long,
            lat: this.lat,
        };
    }
}

export { User }
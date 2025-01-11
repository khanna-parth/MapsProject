import { WebSocket } from "ws";
import { insertUser } from "../db/db";

class User {
    userID: string
    ws: WebSocket
    long: number
    lat: number
    constructor(userID: string, ws: WebSocket) {
        this.userID = userID;
        this.ws = ws;
        this.long = 0;
        this.lat = 0;
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
}

export { User }
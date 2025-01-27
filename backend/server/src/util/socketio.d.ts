import { Socket } from 'socket.io';

declare module 'socket.io' {
  interface Socket {
    userID?: string;
    partyID?: string;
  }
}
import * as utils from './utils.js';
import { io } from "socket.io-client";

import { LOCAL_HOST } from '@env';

let partyID = 0
export const getPartyID = () => {
    partyID += 1;
    return String(partyID);
}

export const getUserFriends = async (currentUser) => {
    const usernameData = await utils.getData("username");

    if (usernameData.error) {
        return {error: true, message: "Error retrieving username."};
    }

    const friendData = await utils.postRequest('social/friends', {username: currentUser});

    if (!friendData.error) {
        let returnData = []

        for (let i = 0; i < friendData.data.length; i++) {
            returnData.push({username: friendData.data[i], cardID: i})
        }

        return {error: false, data: returnData, message: 'Successfully retrieved friends.'}
    }
}

export const getUsers = async (prompt) => {
    try {
        console.log(`Making GET to social/search @ ${LOCAL_HOST}`)

        const res = await fetch(`http://${LOCAL_HOST}/social/search?username=${prompt}`)

        const reqData = await res.json();
    
        if (res.ok) {
            return {error: false, data: reqData, message: "Request successful."};
        } else {
            return {error: true, data: reqData, message: `Returned with error code: ${res.status}`};
        }
        
    } catch (error) {
        return {error: true, message: `Returned with error: ${error}`};
    }
};

export const joinParty = async (userID, partyID) => {
    console.log(`Joining party with ${userID}, ${partyID}.`);
    try {
        return new Promise((resolve, reject) => {
            const socket = io(`http://${LOCAL_HOST}`, {
                path: "/party/join",
                transports: ['websocket'],  // Force WebSocket transport
                query: {
                    userID: String(userID),
                    partyID: String(partyID)
                }
            });

            socket.on("connect", () => {
                console.log("Connected to socket server");
                resolve(socket);
            });
            
            socket.on("disconnect", () => {
                console.log("Disconnected from socket server");
            });

            //return socket;
        });
    } catch (error) {
        console.error("Socket connection error: ", error);
        return null;
    }
    
}
import React, { createContext, useState, useContext, useEffect } from 'react';

import { io } from "socket.io-client";

import { removeData } from '../utils/utils';
import { LOCAL_HOST } from '@env';

const GlobalStateContext = createContext();

export const GlobalStateProvider = ({ children }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [partySocket, setPartySocket] = useState();
    const [userSentLocation, setUserSentLocation] = useState();
    const [userPartyChange, setUserPartyChange] = useState(false);
    const [partyMemberLocation, setPartyMemberLocation] = useState([]);
    const [currentUser, setCurrentUser] = useState("");
    const [disconnectedUser, setDisconnectedUser] = useState("");

    const joinParty = async (userID, partyID) => {
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
                    setPartySocket(socket);
                    setUserPartyChange(true);
                    resolve(socket);
                });
                
                socket.on("connections", (socketData) => {
                    let connections = socketData.split(" ")
                    if (connections[2] == 'disconnected') {
                        setDisconnectedUser(connections[1]);
                        setUserPartyChange(true);
                    }
                    
                    if (connections[2] != currentUser) {
                        setUserPartyChange(true);
                    }
                });
    
                socket.on("location", (socketData) => {
                    setUserSentLocation(socketData);
                });
    
                socket.on("disconnect", () => {
                    console.log("Disconnected from socket server");
                    setPartyMemberLocation([]);
                    removeData('partyID');
                });
    
                //return socket;
            });
        } catch (error) {
            console.error("Socket connection error: ", error);
            return null;
        }
        
    }

    return (
        <GlobalStateContext.Provider value={{ 
            userLocation, setUserLocation, 
            partySocket, setPartySocket,
            userSentLocation, setUserSentLocation,
            userPartyChange, setUserPartyChange,
            partyMemberLocation, setPartyMemberLocation,
            currentUser, setCurrentUser,
            disconnectedUser, setDisconnectedUser,
            joinParty
        }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => {
    return useContext(GlobalStateContext);
};

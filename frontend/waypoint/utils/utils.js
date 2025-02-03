import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from "socket.io-client";
import * as Keychain from 'react-native-keychain';

import { LOCAL_HOST } from '@env';
//const LOCALHOST = process.env.LOCAL_HOST

export const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(String(key), String(value));
        return { error: false, message: "Created successfully." }
    } catch (e) {
        return { error: true, value: e, message: "Error writing to key." }
    }
  };

export const getData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(String(key));
        if (value !== null) {
            return { error: false, data: value, message: "Success." }
        } else {
            return { error: true, message: "No data for that key." }
        }
    } catch (e) {
        return { error: true, data: e, message: "Error reading key." }
    }
};

export const removeData = async (key) => {
    try {
        await AsyncStorage.removeItem(String(key));
        return { error: false, message: "Deleted successfully." };
    } catch (e) {
        return { error: true, data: e, message: "Error deleting key." };
    }
};

export const getRequest = async (address) => {
    try {
        console.log(`Making GET to ${address} @ ${LOCAL_HOST}`)

        const res = await fetch(`http://${LOCAL_HOST}/${address}`, {
            method: 'get',
            headers: {
                "Content-Type": "application/json"
            }
        })
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

export const postRequest = async (address, data={}) => {
    try {
        console.log(`Making POST to ${address} @ ${LOCAL_HOST}`)

        const res = await fetch(`http://${LOCAL_HOST}/${address}`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                data
            )
        })

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

export const storeKeychainData = async (username, password) => {
    try {
        if (!Keychain || !Keychain.setGenericPassword) {
            throw new Error("Keychain module is not properly initialized.");
        }
        
        await Keychain.setGenericPassword(username, password);
        return { error: false, message: "Credentials stored successfully." };
    } catch (e) {
        //console.error("Keychain storage error:", e);
        return { error: true, message: e.message || "Failed to store credentials." };
    }
};


export const getKeychainData = async () => {
    try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
            return { error: false, data: credentials, message: "Credentials retrieved." };
        } else {
            return { error: true, message: "No credentials stored." };
        }
    } catch (e) {
        return { error: true, data: e, message: "Error reading credentials." };
    }
};

export const removeKeychainData = async () => {
    try {
        await Keychain.resetGenericPassword();
        return { error: false, message: "Credentials deleted successfully." };
    } catch (e) {
        return { error: true, data: e, message: "Error deleting credentials." };
    }
};

export const reqSocket = async (userID, partyID) => {
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
                resolve(socket);
            });

            //return socket;
        });
    } catch (error) {
        console.error("Socket connection error: ", error);
        return null;
    }
    
}

export const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

import * as utils from './utils.js';
import { getSyncedData, storeSyncedData } from './syncStorage';

export const getUserFriends = async (currentUser) => {
    try {
        if (!currentUser) {
            console.error("getUserFriends: currentUser is undefined or null");
            return {error: true, message: "Username is required", data: []};
        }
        
        console.log(`Getting friends for user: ${currentUser}`);
        
        const friendData = await utils.postRequest('social/friends', {username: currentUser});
        
        console.log("Friend data response:", friendData);
        
        if (!friendData.error) {
            let returnData = [];
            
            if (Array.isArray(friendData.data)) {
                for (let i = 0; i < friendData.data.length; i++) {
                    const friend = friendData.data[i];
                    // Check if the response is the new format (object with firstName, lastName)
                    // or the old format (just username string)
                    if (typeof friend === 'object') {
                        returnData.push({
                            username: friend.username,
                            firstName: friend.firstName || '',
                            lastName: friend.lastName || '',
                            userID: friend.userID,
                            cardID: i
                        });
                    } else {
                        // Handle old format for backward compatibility
                        returnData.push({username: friend, cardID: i});
                    }
                }
                return {error: false, data: returnData, message: 'Successfully retrieved friends.'};
            } else {
                console.error("Unexpected response format:", friendData.data);
                return {error: true, message: "Unexpected response format", data: []};
            }
        } else {
            console.error("Error in friend data response:", friendData.message);
            return {error: true, message: friendData.message || "Error retrieving friends", data: []};
        }
    } catch (error) {
        console.error("Exception in getUserFriends:", error);
        return {error: true, message: `Error: ${error.message || error}`, data: []};
    }
}

export const getUsers = async (prompt) => {
    try {
        console.log(`Making GET to social/search @ ${utils.API_URL}`)

        const res = await fetch(`${utils.API_URL}/social/search?username=${prompt}`)

        const reqData = await res.json();
    
        if (res.ok) {
            return {error: false, data: reqData, message: "Request successful."};
        } else {
            return {error: true, data: reqData, message: `Returned with error code: ${res.status}`};
        }
        
    } catch (error) {
        return {error: true, message: `Returned with error: ${error}`, data: []};
    }
};

/**
 * Get a user's profile picture - CURRENTLY DISABLED
 * Returns a placeholder since profile picture upload has been disabled
 * 
 * @param {string} username - The username to get the profile picture for
 * @returns {Promise<Object>} - Result with default placeholder
 */
export const getUserProfilePicture = async (username) => {
    try {
        if (!username) {
            console.error("getUserProfilePicture: username is undefined or null");
            return {error: true, message: "Username is required", data: null};
        }
        
        console.log(`Profile picture functionality disabled - returning placeholder for: ${username}`);
        
        // Return a placeholder response
        return {
            error: false, 
            data: {
                username, 
                imageUri: null
            }, 
            message: 'Profile picture feature disabled'
        };
    } catch (error) {
        console.error("Exception in getUserProfilePicture:", error);
        return {error: true, message: `Error: ${error.message || error}`, data: null};
    }
};

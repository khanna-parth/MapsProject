import * as utils from './utils.js';
import { getSyncedData, storeSyncedData } from './syncStorage';

import { LOCAL_HOST } from '@env';

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
                    returnData.push({username: friendData.data[i], cardID: i});
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
        console.log(`Making GET to social/search @ ${LOCAL_HOST}`)

        const res = await fetch(`http://${LOCAL_HOST}/social/search?username=${prompt}`)

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
 * Get a user's profile picture
 * 
 * @param {string} username - The username to get the profile picture for
 * @returns {Promise<Object>} - Result with error status, data, and message
 */
export const getUserProfilePicture = async (username) => {
    try {
        if (!username) {
            console.error("getUserProfilePicture: username is undefined or null");
            return {error: true, message: "Username is required", data: null};
        }
        
        console.log(`Getting profile picture for user: ${username}`);
        
        // First check if we have it cached
        const cachedPicture = await getSyncedData(`profilePicture_${username}`);
        if (cachedPicture && cachedPicture.imageUri) {
            console.log(`Found cached profile picture for ${username}`);
            return {error: false, data: cachedPicture, message: 'Retrieved from cache'};
        }
        
        // If not cached, try to get from server
        console.log(`No cached profile picture for ${username}, fetching from server`);
        const response = await utils.getRequest(`user/profile-picture/${username}`);
        
        console.log(`Server response for ${username}'s profile picture:`, 
            response.error ? 'Error: ' + response.message : 'Success');
        
        if (!response.error && response.data) {
            // Check if we have a valid image URI
            if (response.data.imageUri) {
                console.log(`Successfully retrieved profile picture for ${username} from server`);
                
                // Cache the profile picture
                await storeSyncedData(`profilePicture_${username}`, response.data);
                
                return {error: false, data: response.data, message: 'Successfully retrieved profile picture'};
            } else {
                console.log(`No profile picture set for ${username}`);
                return {error: false, data: {username, imageUri: null}, message: 'User has no profile picture'};
            }
        } else {
            console.error("Error getting profile picture:", response.message);
            if (response.data && response.data.rawResponse) {
                console.error("Raw response:", response.data.rawResponse);
            }
            return {error: true, message: response.message || "Error retrieving profile picture", data: null};
        }
    } catch (error) {
        console.error("Exception in getUserProfilePicture:", error);
        return {error: true, message: `Error: ${error.message || error}`, data: null};
    }
};

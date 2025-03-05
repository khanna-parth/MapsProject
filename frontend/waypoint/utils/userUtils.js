import * as utils from './utils.js';
import { getSyncedData, storeSyncedData } from './syncStorage';

export const getUserFriends = async (currentUser) => {
    try {
        if (!currentUser) {
            return {error: true, message: "Username is required", data: []};
        }
        
        const friendData = await utils.postRequest('social/friends', {username: currentUser});
        
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
                return {error: true, message: "Unexpected response format", data: []};
            }
        } else {
            return {error: true, message: friendData.message || "Error retrieving friends", data: []};
        }
    } catch (error) {
        return {error: true, message: `Error: ${error.message || error}`, data: []};
    }
}

export const getUsers = async (prompt) => {
    try {
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
 * Get a user's profile picture
 * 
 * @param {string} username - The username to get the profile picture for
 * @returns {Promise<Object>} - Result with profile picture data
 */
export const getUserProfilePicture = async (username) => {
    try {
        if (!username) {
            return {error: true, message: "Username is required", data: null};
        }
        
        // Check if we have a cached version first
        const cachedData = await getSyncedData(`profilePicture_${username}`);
        if (cachedData && cachedData.imageUri) {
            return {
                error: false,
                data: cachedData,
                message: 'Retrieved from cache'
            };
        }
        
        // Fetch from server if not cached
        try {
            const response = await utils.get(`user/profile-picture/${username}`);
            
            if (!response.error && response.data) {
                // Cache the profile picture
                await storeSyncedData(`profilePicture_${username}`, response.data);
                
                return {
                    error: false,
                    data: response.data,
                    message: 'Profile picture retrieved successfully'
                };
            } else {
                return {
                    error: true,
                    message: response.message || 'Failed to fetch profile picture',
                    data: null
                };
            }
        } catch (fetchError) {
            return {
                error: true,
                message: `Network error: ${fetchError.message || fetchError}`,
                data: null
            };
        }
    } catch (error) {
        return {error: true, message: `Error: ${error.message || error}`, data: null};
    }
};

/**
 * Update a user's profile picture
 * 
 * @param {string} username - The username to update the profile picture for
 * @param {string} imageUri - The base64 encoded image or image URI
 * @returns {Promise<Object>} - Result of the update operation
 */
export const updateProfilePicture = async (username, imageUri) => {
    try {
        if (!username) {
            return {error: true, message: "Username is required"};
        }
        
        if (!imageUri) {
            return {error: true, message: "Image data is required"};
        }
        
        // Send to server
        try {
            const response = await utils.post('user/profile-picture', {
                username,
                imageUri
            });
            
            if (!response.error) {
                // Update local cache
                await storeSyncedData(`profilePicture_${username}`, {
                    username,
                    imageUri,
                    timestamp: new Date().toISOString()
                });
                
                return {
                    error: false,
                    message: 'Profile picture updated successfully'
                };
            } else {
                return {
                    error: true,
                    message: response.message || 'Failed to update profile picture'
                };
            }
        } catch (networkError) {
            return {
                error: true, 
                message: `Network error: ${networkError.message || 'Connection failed'}`
            };
        }
    } catch (error) {
        return {error: true, message: `Error: ${error.message || error}`};
    }
};

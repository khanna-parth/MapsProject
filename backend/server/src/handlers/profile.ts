import { User } from '../models/user';
import { UserDB } from '../db/dbuser';

interface ProfileResult {
    success: boolean;
    data?: any;
    code: number;
    error?: string;
}

/**
 * Update a user's profile picture
 * 
 * @param username - The username of the user
 * @param imageUri - The image URI of the profile picture
 * @returns ProfileResult with success status
 */
export const updateProfilePicture = async (username: string, imageUri: string): Promise<ProfileResult> => {
    try {
        if (!username) {
            return { success: false, code: 400, error: "Username is required" };
        }

        if (!imageUri) {
            return { success: false, code: 400, error: "Image URI is required" };
        }

        // Find the user
        const user = await UserDB.dbFindUsername(username);
        if (!user) {
            return { success: false, code: 404, error: "User not found" };
        }

        // Update the profile picture
        user.profilePicture = imageUri;
        await user.syncDB();

        return { 
            success: true, 
            code: 200, 
            data: { 
                username: user.username,
                profilePicture: user.profilePicture 
            } 
        };
    } catch (error) {
        console.error("Error updating profile picture:", error);
        return { success: false, code: 500, error: "Internal server error" };
    }
};

/**
 * Get a user's profile picture
 * 
 * @param username - The username of the user
 * @returns ProfileResult with the profile picture data
 */
export const getProfilePicture = async (username: string): Promise<ProfileResult> => {
    try {
        if (!username) {
            return { success: false, code: 400, error: "Username is required" };
        }

        // Find the user
        const user = await UserDB.dbFindUsername(username);
        if (!user) {
            return { success: false, code: 404, error: "User not found" };
        }

        return { 
            success: true, 
            code: 200, 
            data: { 
                username: user.username,
                imageUri: user.profilePicture || "",
                timestamp: new Date().toISOString()
            } 
        };
    } catch (error) {
        console.error("Error getting profile picture:", error);
        return { success: false, code: 500, error: "Internal server error" };
    }
}; 
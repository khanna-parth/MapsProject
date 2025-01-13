import { User } from "../models/user";
import { db } from "./client";


class SocialDB {
    static async addFriends(user: User, friendUser: User): Promise<{ added: boolean, code: number, error?: string }> {
        try {
            const userWithFriends = await User.findOne({
                where: { userID: user.userID },
                relations: ['friends'],
            });

            if (!userWithFriends) {
                return { added: false, code: 404, error: `User not found.` };
            }

            const isAlreadyFriends = userWithFriends.friends?.some(friend => friend.userID === friendUser.userID);
            if (isAlreadyFriends) {
                return { added: false, code: 200, error: "Friend already exists." };
            }

            userWithFriends.friends?.push(friendUser);
            friendUser.friends?.push(userWithFriends);

            await User.save(userWithFriends);
            await User.save(friendUser);

            console.log(`Added ${user.username} and ${friendUser.username} as friends`);
            return { added: true, code: 200 };
        } catch (error) {
            console.log(`Error adding friends: ${error}`);
            return { added: false, code: 500, error: `Error: ${error}` };
        }
    }

    static async removeFriends(user: User, friend: User): Promise<{ removed: boolean, code: number, error?: string }> {
        try {
            // Load the user's friends relationship
            const userWithFriends = await User.findOne({
                where: { userID: user.userID },
                relations: ['friends'],
            });
    
            if (!userWithFriends) {
                return { removed: false, code: 404, error: `User not found.` };
            }
    
            const isFriends = userWithFriends.friends?.some(existingFriend => existingFriend.userID === friend.userID);
            if (!isFriends) {
                return { removed: false, code: 400, error: `${friend.username} is not a friend.` };
            }
    
            userWithFriends.friends = userWithFriends.friends?.filter(existingFriend => existingFriend.userID !== friend.userID);
    
            const friendWithFriends = await User.findOne({
                where: { userID: friend.userID },
                relations: ['friends'],
            });
    
            if (friendWithFriends) {
                friendWithFriends.friends = friendWithFriends.friends?.filter(existingFriend => existingFriend.userID !== user.userID);
                await User.save(friendWithFriends);
            }
    
            await User.save(userWithFriends);
    
            console.log(`Removed ${user.username} and ${friend.username} as friends`);
            return { removed: true, code: 200 };
        } catch (error) {
            console.log(`Error removing friends: ${error}`);
            return { removed: false, code: 500, error: `Error: ${error}` };
        }
    }

    static async getFriends(user: User): Promise<{ success: boolean; friends?: User[], code: number; error?: string }> {
        try {
            const userWithFriends = await User.findOne({
                where: { userID: user.userID },
                relations: ['friends'],
            });

            if (!userWithFriends) {
                return { success: false, code: 404, error: `User not found.` };
            }

            user.friends = userWithFriends.friends || [];

            console.log(`Loaded friends for ${user.username}:`, user.friends.map(friend => friend.username));
            return { success: true, friends: user.friends, code: 200 };
        } catch (error) {
            console.log(`Error loading friends: ${error}`);
            return { success: false, code: 500, error: `Error: ${error}` };
        }
    }
}

export { SocialDB }
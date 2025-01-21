import db from '../database/models/index'; // Import Sequelize models

class SocialDB {
  static async addFriends(userID: string, friendUserID: string): Promise<{ added: boolean; code: number; error?: string }> {
    const transaction = await db.sequelize.transaction();
    try {
      const user = await db.User.findByPk(userID, {
        include: [{ model: db.User, as: 'friends' }],
        transaction,
      });

      if (!user) {
        return { added: false, code: 404, error: 'User not found.' };
      }

      const isAlreadyFriends = user.friends?.some((friend: any) => friend.userID === friendUserID);
      if (isAlreadyFriends) {
        return { added: false, code: 200, error: 'Friend already exists.' };
      }

      const friendUser = await db.User.findByPk(friendUserID, { transaction });
      if (!friendUser) {
        return { added: false, code: 404, error: 'Friend user not found.' };
      }

      // Add the friend relationship
      await user.addFriend(friendUser, { transaction });
      await transaction.commit();

      console.log(`Added ${user.username} and ${friendUser.username} as friends`);
      return { added: true, code: 200 };
    } catch (error: any) {
      await transaction.rollback();
      console.error(`Error adding friends: ${error.message}`);
      return { added: false, code: 500, error: `Error: ${error.message}` };
    }
  }

  static async removeFriends(userID: string, friendUserID: string): Promise<{ removed: boolean; code: number; error?: string }> {
    const transaction = await db.sequelize.transaction();
    try {
      const user = await db.User.findByPk(userID, {
        include: [{ model: db.User, as: 'friends' }],
        transaction,
      });

      if (!user) {
        return { removed: false, code: 404, error: 'User not found.' };
      }

      const isFriends = user.friends?.some((friend: any) => friend.userID === friendUserID);
      if (!isFriends) {
        return { removed: false, code: 400, error: 'Friend relationship does not exist.' };
      }

      const friendUser = await db.User.findByPk(friendUserID, { transaction });
      if (!friendUser) {
        return { removed: false, code: 404, error: 'Friend user not found.' };
      }

      // Remove the friend relationship
      await user.removeFriend(friendUser, { transaction });
      await transaction.commit();

      console.log(`Removed ${user.username} and ${friendUser.username} as friends`);
      return { removed: true, code: 200 };
    } catch (error: any) {
      await transaction.rollback();
      console.error(`Error removing friends: ${error.message}`);
      return { removed: false, code: 500, error: `Error: ${error.message}` };
    }
  }

  static async getFriends(userID: string): Promise<{ success: boolean; friends?: any[]; code: number; error?: string }> {
    try {
      const user = await db.User.findByPk(userID, {
        include: [{ model: db.User, as: 'friends' }],
      });

      if (!user) {
        return { success: false, code: 404, error: 'User not found.' };
      }

      const friends = user.friends || []; // Return an empty array if no friends
      console.log(`Loaded friends for ${user.username}:`, friends.map((friend: any) => friend.username));
      return { success: true, friends, code: 200 };
    } catch (error: any) {
      console.error(`Error loading friends: ${error.message}`);
      return { success: false, code: 500, error: `Error: ${error.message}` };
    }
  }
}

export { SocialDB };

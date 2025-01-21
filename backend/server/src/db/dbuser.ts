import db from '../database/models/index'; // Import Sequelize models

class UserDB {
  /**
   * Find a user by username.
   * @param username - The username to search for.
   * @returns The user object or null if not found.
   */
  static async dbFindUsername(username: string): Promise<InstanceType<typeof db.User> | null> {
    try {
      const user = await db.User.findOne({
        where: { username },
      });
      return user;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find a user by their userID.
   * @param userID - The userID to search for.
   * @returns The user object or null if not found.
   */
  static async dbFindID(userID: string): Promise<InstanceType<typeof db.User> | null> {
    try {
      const user = await db.User.findByPk(userID);
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
}

export { UserDB };

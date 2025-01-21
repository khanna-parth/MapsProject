import { SocialDB } from '../db/dbsocial';
import db from '../database/models/index';
import { checkValidString } from '../util/util';

/**
 * Adds a friend relationship between two users.
 * @param username - The username of the user.
 * @param friendUsername - The username of the friend.
 * @returns The result of the friend addition operation.
 */
const addFriend = async (username: string, friendUsername: string) => {
  if (!checkValidString(username) || !checkValidString(friendUsername)) {
    return { added: false, code: 400, error: 'Invalid username or friendUsername' };
  }

  const user = await db.User.findOne({ where: { username } });
  const friend = await db.User.findOne({ where: { username: friendUsername } });

  if (!user || !friend) {
    return { added: false, code: 404, error: 'User or friend not found' };
  }

  return SocialDB.addFriends(user.userID, friend.userID); // Pass userID strings
};

/**
 * Removes a friend relationship between two users.
 * @param username - The username of the user.
 * @param friendUsername - The username of the friend.
 * @returns The result of the friend removal operation.
 */
const removeFriend = async (username: string, friendUsername: string) => {
  if (!checkValidString(username) || !checkValidString(friendUsername)) {
    return { removed: false, code: 400, error: 'Invalid username or friendUsername' };
  }

  const user = await db.User.findOne({ where: { username } });
  const friend = await db.User.findOne({ where: { username: friendUsername } });

  if (!user || !friend) {
    return { removed: false, code: 404, error: 'User or friend not found' };
  }

  return SocialDB.removeFriends(user.userID, friend.userID); // Pass userID strings
};

/**
 * Retrieves the friends of a user.
 * @param username - The username of the user.
 * @returns The result containing the list of friends or an error message.
 */
const getFriends = async (username: string) => {
  if (!checkValidString(username)) {
    return { code: 400, error: 'Invalid username' };
  }

  const user = await db.User.findOne({ where: { username } });
  if (!user) {
    return { code: 404, error: 'User not found' };
  }

  return SocialDB.getFriends(user.userID); // Pass userID string
};

export { addFriend, removeFriend, getFriends };

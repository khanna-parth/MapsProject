import bcrypt from 'bcryptjs';
import db from '../database/models/index'; // Import Sequelize models
import pool from '../database/models/pool'; // Pool management
import { checkValidString } from '../util/util';
import { v4 as uuidv4 } from 'uuid';

// Define a shared interface for users registered in the Pool
interface PoolUser {
  userID: string;
  username: string;
  coordinates: { long: number; lat: number };
  partyID: string;
}

interface AccessUserResult {
  success: boolean;
  user?: any; // You may replace 'any' with Sequelize's User model type
  code: number;
  error?: string;
}

/**
 * Creates a new user.
 * @param username - The username of the new user.
 * @param password - The password of the new user.
 * @returns AccessUserResult containing success status and the user object if successful.
 */
const createUser = async (username: string, password: string): Promise<AccessUserResult> => {
  if (!checkValidString(username) || !checkValidString(password)) {
    return { success: false, code: 400, error: 'Invalid username or password' };
  }

  // Check if the user already exists
  const existingUser = await db.User.findOne({ where: { username } });
  if (existingUser) {
    return { success: false, code: 400, error: 'User already exists' };
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user
  const newUser = await db.User.create({
    userID: uuidv4(),
    username,
    password: hashedPassword,
    coordinates: { long: 0, lat: 0 }, // Default coordinates
  });

  // Register the user in the pool with a default party
  const poolUser: PoolUser = {
    userID: newUser.userID,
    username: newUser.username,
    coordinates: newUser.coordinates,
    partyID: 'default', // Default party ID
  };

  // Add the user to the pool
  pool.registerUser(poolUser);

  console.log(`Created user with ID: ${newUser.userID}`);
  return { success: true, user: newUser, code: 201 };
};

/**
 * Logs in a user by verifying their credentials.
 * @param username - The username of the user.
 * @param password - The password of the user.
 * @returns AccessUserResult containing success status and the user object if successful.
 */
const loginUser = async (username: string, password: string): Promise<AccessUserResult> => {
  if (!checkValidString(username) || !checkValidString(password)) {
    return { success: false, code: 400, error: 'Invalid username or password' };
  }

  // Find the user by username
  const user = await db.User.findOne({ where: { username } });
  if (!user) {
    return { success: false, code: 400, error: 'Invalid credentials' };
  }

  // Verify the password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return { success: false, code: 400, error: 'Invalid credentials' };
  }

  console.log(`Approved sign-in request from user account: ${username}`);
  return { success: true, user, code: 200 };
};

export { createUser, loginUser };

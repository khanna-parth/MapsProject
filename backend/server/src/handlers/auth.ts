import bcrypt from 'bcryptjs';
import { User } from '../models/user';
import { pool } from '../models/pool';
import { checkValidString } from '../util/util';

let users: {username: string, password: string}[] = []

interface AccessUserResult {
    success: boolean;
    user?: User
    code: number;
    error?: string;
}

const createUser = async (username: string, password: string): Promise<AccessUserResult> => {
    if (!checkValidString(username)) {
        return {success: false, code: 400, error: "partyID must be properly specified"}
    }

    if (!checkValidString(password)) {
        return {success: false, code: 400, error: "userID must be properly specified"}
    }

    if (pool.userExistsByName(username)) {
        return { success: false, code: 400, error: "user already exists"}
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User(username, hashedPassword);
    pool.registerUser(user);
    console.log(`Created user with id: ${user.userID}`)

    return { success: true, user: user, code: 201}
}

const loginUser = async (username: string, password: string): Promise<AccessUserResult> => {
    if (!checkValidString(username)) {
        return { success: false, code: 400, error: "username must be provided"}
    }

    if (!checkValidString(password)) {
        return { success: false, code: 400, error: "password must be provided"}
    }

    const exists = pool.userExistsByName(username)
    if (!exists) {
        return {success: false, code: 400, error: "Invalid user credentials provided"}
    }

    const matchedPassword = await bcrypt.compare(password, exists.password)

    if (exists.username == username && matchedPassword) {
        console.log(`Approved sign in request from user account: ${username}`)
        return { success: true, user: exists, code: 200}
    } else {
        console.log(`Unsuccessful sign in attempt from user account: ${username}`)
        return { success: false, code: 400, error: "Invalid user credentials provided"}
    }
}

export { createUser, loginUser }
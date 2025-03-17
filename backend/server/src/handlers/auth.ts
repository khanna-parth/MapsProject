import bcrypt from 'bcryptjs';
import { User } from '../models/user';
import { pool } from '../models/pool';
import { checkValidString } from '../util/util';
// import { dbFindUsername } from '../db/dbuser';
import { v4 as uuidv4 } from 'uuid';
import { UserDB } from '../db/dbuser';

let users: {username: string, password: string}[] = []

interface AccessUserResult {
    success: boolean;
    user?: User
    users?: User[]
    usernames?: string[]
    avatars?: Map<string,string>
    code: number;
    error?: string;
}

const createUser = async (firstName: string, lastName: string, email: string, username: string, password: string): Promise<AccessUserResult> => {
    const fields = ['firstName', 'lastName', 'email', 'username', 'password'];
    const values = [firstName, lastName, email, username, password];

    // Get more familiar with .reduce as a cleaner way of checking invalid fields. Suggestion on stackoverflow
    const invalidFields = fields.reduce<string[]>((acc, field, index) => {
        if (!checkValidString(values[index])) {
            acc.push(`Invalid field value for ${field}: ${values[index]}`);
        }
        return acc;
    }, []);

    if (invalidFields.length > 0) {
        return { success: false, code: 400, error: invalidFields[0]}
    }

    const exists = await UserDB.dbFindUsername(username)
    if (exists) {
        return { success: false, code: 400, error: "user already exists"}
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = User.CreateUser(firstName, lastName, email, username, hashedPassword);
    pool.registerUser(user);
    await user.syncDB();
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
    
    const exists = await UserDB.dbFindUsername(username)
    if (!exists) {
        return { success: false, code: 400, error: "invalid credentials provided"}
    }

    const matchedPassword = await bcrypt.compare(password, exists.password)

    if (exists.username == username && matchedPassword) {
        console.log(`Approved sign in request from user account: ${username}`)
        if (!pool.userExistsByID(exists.userID)) {
            pool.registerUser(exists);
        }
        return { success: true, user: exists, code: 200}
    } else {
        console.log(`Unsuccessful sign in attempt from user account: ${username}`)
        return { success: false, code: 400, error: "invalid user credentials provided"}
    }
}

const modifyPFP = async(username: string): Promise<void> => {
    if (!checkValidString(username)) {
        // Invalid username
    }
    
    const exists = await UserDB.dbFindUsername(username)
    if (!exists) {
        // Nonexistent user
    }

}

export { createUser, loginUser, AccessUserResult }
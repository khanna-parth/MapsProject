import { User } from "../models/user";
import { db } from "./client";


class UserDB {
    static async dbFindUsername(username: string): Promise<User | null> {
        const userRepository = db.getRepository(User);

        const user = await userRepository.findOne({
            where: {
                username: username,
            },
        });
        return user
    }

    static async dbFindID(userID: string): Promise<User | null> {
        const userRepository = db.getRepository(User);

        const user = await userRepository.findOne({
            where: {
                userID: userID,
            },
        });
        return user
    }
}

export { UserDB }
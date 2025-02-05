import { User } from "../models/user";
import { db } from "./client";
import { Like, Raw } from "typeorm";

class UserDB {
    static async dbFindUsername(username: string): Promise<User | null> {
        const userRepository = db.getRepository(User);

        const user = await userRepository.findOne({
            where: { username: username }, 
            relations: ['friends'],
        });
        return user
    }

    static async dbFindID(userID: string): Promise<User | null> {
        const userRepository = db.getRepository(User);

        const user = await userRepository.findOne({
            where: { userID: userID},
            relations: ['friends'],
        });
        return user
    }

    static async dbFindUserWithUsername(username: string): Promise<string[]> {
        const users = await User.find({
            select: ["username"],
            where: {
                username: Raw((alias: string) => `LOWER(${alias}) LIKE LOWER(:value)`, { 
                    value: `${username}%` 
                })
            }
        });
        return users.map(user => user.username);
    }
}

export { UserDB }
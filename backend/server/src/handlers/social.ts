import { TreeLevelColumn } from "typeorm"
import { SocialDB } from "../db/dbsocial"
import { UserDB } from "../db/dbuser"
import { User } from "../models/user"
import { checkValidString } from "../util/util"

const addFriend = async (userName: string, friendUsername: string): Promise<{added: boolean, code: number, error?: string}> => {
    if (!checkValidString(userName)) {
        return { added: false, code: 400, error: "must enter valid userName"}
    }

    const user = await UserDB.dbFindUsername(userName)
    const friend = await UserDB.dbFindUsername(friendUsername)

    if (!user || !friend) {
        return { added: false, code: 400, error: 'User or friend does not exist'}
    }

    const result = await SocialDB.addFriends(user, friend)
    
    return result;
}

const removeFriend = async (userName: string, friendUsername: string): Promise<{removed: boolean, code: number, error?: string}> => {
    if (!checkValidString(userName)) {
        return { removed: false, code: 400, error: "must enter valid userName"}
    }

    const user = await UserDB.dbFindUsername(userName)
    const friend = await UserDB.dbFindUsername(friendUsername)

    if (!user || !friend) {
        return { removed: false, code: 400, error: 'User or friend does not exist'}
    }

    const result = await SocialDB.removeFriends(user, friend)
    
    return result;
}


const getFriends = async (userName: string): Promise<{friends?: User[], code: number, error?: string}> => {
    if (!checkValidString(userName)) {
        return { code: 400, error: "must enter valid userName"}
    }

    const user = await UserDB.dbFindUsername(userName)

    if (!user) {
        return { code: 400, error: 'User or friend does not exist'}
    }

    const result = await SocialDB.getFriends(user)
    return result;
}

export { addFriend, removeFriend, getFriends }
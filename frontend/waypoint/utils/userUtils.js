import * as utils from './utils.js';

let partyID = 0
export const getPartyID = () => {
    partyID += 1;
    return String(partyID);
}

export const getUserFriends = async (currentUser) => {
    const usernameData = await utils.getData("username");

    if (usernameData.error) {
        return {error: true, message: "Error retrieving username."};
    }

    const friendData = await utils.postRequest('social/friends', {username: currentUser});

    if (!friendData.error) {
        let returnData = []

        for (let i = 0; i < friendData.data.length; i++) {
            returnData.push({username: friendData.data[i], cardID: i})
        }

        return {error: false, data: returnData, message: 'Successfully retrieved friends.'}
    }
}
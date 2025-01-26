interface CreatePartyRequest {
    partyID: string;
    userID: string;
}

interface AccessUserRequest {
    username: string;
    password: string;
}

interface AddFriendsRequest {
    username: string;
    friendUsername: string;
}

interface GetFriendsRequest {
    username: string;
}

export { CreatePartyRequest, AccessUserRequest, AddFriendsRequest, GetFriendsRequest }
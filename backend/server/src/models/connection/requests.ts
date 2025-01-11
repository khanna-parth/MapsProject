interface CreatePartyRequest {
    partyID: string;
    userID: string;
}

interface AccessUserRequest {
    username: string;
    password: string;
}

export { CreatePartyRequest, AccessUserRequest }
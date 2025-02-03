import { Coordinates } from "../geolocation";

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

interface SearchUsersRequest {
    username: string;
}

interface DirectionsRequest {
    origin: Coordinates
    destination: Coordinates
    originString: string
    destinationString: string
}

export { CreatePartyRequest, AccessUserRequest, AddFriendsRequest, GetFriendsRequest, SearchUsersRequest, DirectionsRequest }
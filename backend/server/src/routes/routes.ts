const ROUTES = {
    CREATE_USER: "/auth/create",
    LOGIN_USER: "/auth/login",
    ADD_FRIEND: "/social/add",
    REMOVE_FRIEND: "/social/remove",
    GET_FRIENDS: "/social/friends",
    SEARCH_USERS: "/social/search",
    CREATE_PARTY: "/party/create",
    MODIFY_PARTY: "/party/modify",
    JOIN_PARTY: "/party/join",
    PARTY_STATUS: "/party/status",
    GET_DIRECTIONS: "/routing/fetch",
    SEARCH_PLACES: "/routing/search",
    FEED_PLACES: "/routing/feed",
    UPDATE_PROFILE_PICTURE: "/user/profile-picture",
    GET_PROFILE_PICTURE: "/user/profile-picture/:username",
};

export default ROUTES;
API Endpoints

** VIEW RAW FILE BECAUSE ITS FORMATTED **


Group /auth

/auth/create will be a POST request that will return a 201 Created response or 400 error codes. Response content will be the resultant user as a json object.
    Request data:
        string username: Username of the account
        string password: Password of the account
    Return data:
        {
            "username": "johndoe",
            "userID": "abcd0123",
            "long": 0,
            "lat": 0
        }
    Validation:
        If the fields are empty, will return 400 Bad Request error code
    Task:
        After ensuring the fields aren't empty, it will create a new User object, add it onto the user list.
    Use:
        For authentication sign up page
    Note/BEHAVIOR:
        Normal HTTP request
        After the credentials are provided, the user is saved but the password is hashed, API requests do not need to worry about this
            Just ensures that the password isn't stored in its unsafe/raw form anywhere. It will always be hashed/unhashed.

/auth/login will be a POST request that will return a 200 OK response or 400 error codes. Response content will be the resultant user as a json object.
    Request data:
        string username: Username of the account
        string password: Password of the account
    Return data:
        {
            "username": "johndoe",
            "userID": "abcd0123",
            "coordinates": {
                "long": 0,
                "lat": 0
            }
        }
    Validation:
        If the fields are empty, will return 400 Bad Request error code
        If the username/password do NOT EXACTLY match what is stored, will return 400 Bad Request error code
    Task:
        After ensuring the fields aren't empty, it will check if a user with that information matches that, and then return the user
    Use:
        For authentication login page
    Note/BEHAVIOR:
        Normal HTTP request
        Must match stored credentials exactly
            Will NOT verify whether the username was right and the password is wrong.
                Worse in user-security because it exposes which usernames are valid.
        

Group: /social

/social/add will be a POST request that will return a 200 OK response or a 400 error code. Response content is irrelevant but will be a simple message to state whether the request worked or not.
    Request data:
        string username: Username of account1
        string friendUsername: Username of account2
    Validation:
        If the fields are empty, will return 400 Bad Request error code.
        If the usernames do not map to a user, will return a 400 Bad Request error code
    Task:
        After ensuring the fields are valid, it goes into the Postgres database and adds a relational mapping to both users through a user_friends_table
    Use:
        For creating a friendship between two users
    Note/BEHAVIOR:
        Normal HTTP request
        Must match usernames exactly
        Will return no response if the friendship does not exist. (200 OK status code)
        Will return a message notifying of existing friendship if it does exist (200 OK status code)

/social/remove will be a POST request that will return a 200 OK response or a 400 error code. Response content is irrelevant but will be a simple message to state whether the request worked or not.
    Request data:
        string username: Username of account1
        string friendUsername: Username of account2
    Validation:
        If the fields are empty, will return 400 Bad Request error code.
        If the usernames do not map to a user, will return a 400 Bad Request error code
    Task:
        After ensuring the fields are valid, it goes into the Postgres database and removes the relational mapping to both users through a user_friends_table
    Use:
        For removing a friendship between two users
    Note/BEHAVIOR:
        Normal HTTP request
        Must match usernames exactly
        Will return no response if the friendship exists if used a singular time (200 OK status code)
        Will return a message notifying that there is no existing friendship if used subsequent times (200 OK status code)

/social/list will be a POST request that will return a 200 OK response or a 400 error code. Response content will be a list of usernames corresponding to the friends that the user has.
    Request data:
        string username: Username of account
    Validation:
        If the field is empty, will return 400 Bad Request error code.
        If the username does not map to a user, will return a 400 Bad Request error code
    Task:
        After ensuring the field is valid, it fetch the user from the Postgres database, look through the user's relational mappings, and return all friends. Will only return the usernames of friends(privacy reasons)
    Use:
        For listing all friendships belonging to a user
    Note/BEHAVIOR:
        Normal HTTP request
        Must match username exactly
        Will return empty array if no friends exist
        Friends are not explicitly sorted in any order

/social/search will be a GET request that will return a 200 OK response or a 400 error code. Response content will contain all the usernames that match the search query.
    Request URL Parameter data:
        string username: Username that you want to search the database for
    Validation:
        If the search query is under 3 characters, it will return 404 bad request.
        If no usernames match the search query, it will return 404 bad reuqest
    Task:
        After ensuring the url param fields are valid, it goes into the Postgres database and fetches all usernames that contain the search substring
    Use:
        Searching existing usernames in db
    Note/BEHAVIOR:
        Normal HTTP request
        Search query MUST be provided as a URL parameter(NOT JSON BODY)
        Returns 200 or 404 or 500(rare internal server error)


Group: /party

/party/create will be a POST request that will return with a 200 OK response or 400, 500 error codes. Response content is not relevant
    Request data:
        string userID: User identifier for creating party
    Validation:
        If fields are empty, will return 400 Bad Request error code
    Task:
        After verifying that the fields are included, it will create a party object and allocate it in the pool.
        Prior to creation, will continuously keep generating a free identifier
        Will return immedately signaling whether the party is ready for use or not
    Use:
        Create a group or party to await adding users or location updates
    NOTE/BEHAVIOR:
        Normal HTTP request
        You must connect to the same party using the same partyID within the companion /join endpoint within ~30 second set timeframe.
        If the member count for the party hits 0 at any point in time and at the same time the party monitoring interval has struck, the party object will be deleted and removed from the pool
        This is to prevent tons of empty parties to be allocated/monitored which consumes system resouces

/party/join will be a SocketIO request that will result in a successful SocketIO connection result or an error
    Request URL parameters:
        partyID: Name of the party that you want to join
        userID: User identifier for registering joined party
    Validation:
        If fields are empty, will fail SocketIO connection
        If PartyID provided doesn't map to a valid existing party, will fail SocketIO connection
    Task:
        Will continously poll, listen to all the different channels
    Use:
        Send coordinates over time to this endpoint which will be shared across the party members
    NOTE/BEHAVIOR:
        Upon disconnecting from the party, the registerd user provided in this join command will be removed from the party's members.
        If the member count hits 0 at any point of time and at the same time the party monitoring interval has struck, the party object will be deleted and removed from the pool
        If the user (re-)requests this endpoint while already connected, they will be disconnected from the prior connection and added to the new one.

    TODO: PROVIDE DOCUMENTATION ON CHANNELS


Group: /routing

/routing/search will be a POST request that will result in a 200 OK or 400/500 errors
    Request data:
        string query: Name or search query to retrieve results for
        string lat: Latitude coordinate for location biased results
        string long: Longitude coordinate for location biased results
    Validation:
        Check if query is empty
        Check if lat/long are empty
    Task:
        Use Google Places API to show places with names/details matching query
    Use:
        Search for places around the user and get their details
    Note/Behavior:
        N/A

/routing/feed will be a POST request that will result in a 200 OK or 400/500 errors
    Request data:
        string lat: Latitude of origin to suggest for
        string long: Longitude of origin to suggest for
    Validation:
        Check if fields is empty
    Task:
        Use Google Places API to show places surrounding origin coordinates within a 500 meter radisu
    Use:
        Show feed of results
    Note/Behavior:
        Only queries within a 500 meter radius of origin

/routing/fetch will be a POST request that will result in a 200 OK or 400/500 errors
    Request data(Type 1):
        obj origin: {
            string lat: Latitude of origin
            string long: Longitude of origin
        }
        obj destination: {
            string lat: Latitude of destination
            string long: Longitude of destination
        }
    Request data(Type 2):
        string originString: Name of origin place as string
        string destinationString: Name of destination place as string
    Validation:
        Check if either type is completely provided
    Task:
        Use Google Maps API to provide routing
    Use:
        Show step by step directions and get step by step polylines
    Note/Behavior:
        Type 1 or Type 2 must be COMPLTELY provided.
        When using type 2, be as descriptive as possible as it searches just based on a string(rather than exact coordinates)
    





DISREGARD(READ Use):
/party/status will be a POST request that will result in a 200 OK or a 400, 403, 404 error codes.
    Request data:
        string userID: userID retrieved from signup or login endpoints (not the same as username)
        string partyID: partyID of the party to fetch current status from
    Return data:
        {
            "connected": [
                {
                    "username": "johndoe",
                    "userID": "2kagqks",
                    "long": 0,
                    "lat": 0
                }
            ]
        }
    Validation:
        If fields are empty, will retunr 400 Bad Request error code
        If partyID doesn't map to an existing party, will return 404 Not Found
        if party is found but userID doesn't belong to party's members, will return 403 Forbidden
    Task:
        After verifying the fields, it will get the current party object and return that object
    Use:
        Originally designed to display other party member's coordinates but that will be done over WS(/party/join endpoint). 
    Note/BEHAVIOR:
        Will need provided userID to be currently connected to the party

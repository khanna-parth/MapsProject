API Endpoints

** VIEW RAW FILE BECAUSE ITS FORMATTED **

RUN COMMAND: docker-compose up


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


Group: /party

/party/create will be a GET request that will return with a 200 OK response or 400, 500 error codes. Response content is not relevant
    Request data:
        string partyID: Name of the party that you want to create
        string userID: User identifier for creating party
    Validation:
        If fields are empty, will return 400 Bad Request error code
        If party under partyID already exists, will return 400 Bad Request error code
    Task:
        After verifying that the fields are included, it will create a party object and allocate it in the pool.
        Will return immedately signaling whether the party is ready for use or not
    Use:
        Create a group or party to await adding users or location updates
    NOTE/BEHAVIOR:
        Normal HTTP request
        You must connect to the same party using the same partyID within the companion /join endpoint within ~30 second set timeframe.
        If the member count for the party hits 0 at any point in time and at the same time the party monitoring interval has struck, the party object will be deleted and removed from the pool
        This is to prevent tons of empty partys to be allocated/monitored which consumes system resouces

/party/join will be a GET request that will result in 101 Switching Protocols response if successful or return 400, 500 error codes. No response content
    Request headers:
        X-Party-ID: Name of the party that you want to join
        X-User-ID: User identifier for registering joined party
    Validation:
        If fields are empty, will return 400 Bad Request error code
        If PartyID provided doesn't map to a valid existing party, will return 400 Bad Request error code
    Task:
        After verifying the fields are included, it will attempt to upgrade the current connection to a Websocket connection and then continuously listen for messages to write to the party or read from
        Will continously poll, will not have any response content(unless possibly an error)
    Use:
        Send coordinates over time to this endpoint which will be shared across the party members
    NOTE/BEHAVIOR:
        Will attempt to switch to a long-running Websocket protocol
        Upon disconnecting from the party, the registerd user provided in this join command will be removed from the party's members.
        If the member count hits 0 at any point of time and at the same time the party monitoring interval has struck, the party object will be deleted and removed from the pool
        If the user (re-)requests this endpoint while already connected, they will be disconnected from the prior connection and added to the new one.



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

API Endpoints

Group: /session

/session/create will be a GET function that will return with a 200 OK response or 400, 500 error codes. Response content is not relevant
    Request data:
        string sessionID: Name of the session that you want to create
        string userID: User identifier for creating session
    Validation:
        If fields are empty, will return 400 Bad Request error code
        If session under sessionID already exists, will return 400 Bad Request error code
    Task:
        After verifying that the fields are included, it will create a session object and allocate it in the pool.
        Will return immedately signaling whether the session is ready for use or not
    Use:
        Create a group or session to await adding users or location updates
    NOTE/BEHAVIOR:
        Normal HTTP request
        You must connect to the same session using the same sessionID within the companion /join endpoint within ~30 second set timeframe.
        If the member count for the session hits 0 at any point in time and at the same time the session monitoring interval has struck, the session object will be deleted and removed from the pool
        This is to prevent tons of empty sessions to be allocated/monitored which consumes system resouces

/session/join will be a GET function that will result in 101 Switching Protocols response if successful or return 400, 500 error codes.
    Request headers:
        X-Session-ID: Name of the session that you want to join
        X-User-ID: User identifier for registering joined session
    Validation:
        If fields are empty, will return 400 Bad Request error code
        If sessionID provided doesn't map to a valid existing session, will return 400 Bad Request error code
    Task:
        After verifying the fields are included, it will attempt to upgrade the current connection to a Websocket connection and then continuously listen for messages to write to the session or read from
        Will continously poll, will not have any response content(unless possibly an error)
    Use:
        Send coordinates over time to this endpoint which will be shared across the session members
    NOTE/BEHAVIOR:
        Will attempt to switch to a long-running Websocket protocol
        Upon disconnecting from the session, the registerd user provided in this join command will be removed from the session's members.
        If the member count hits 0 at any point of time and at the same time the session monitoring interval has struck, the session object will be deleted and removed from the pool
        If the user (re-)requests this endpoint while already connected, they will be disconnected from the prior connection and added to the new one.



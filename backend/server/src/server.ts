import cluster from 'cluster';
import axios from 'axios';
import express, { Request, Response } from 'express';
import { createParty, getParty, modifyParty  } from './handlers/party';
import ROUTES from './routes/routes';
import { createUser, loginUser } from './handlers/auth';
import { connectDB } from './db/client';
import { addFriend, getFriends, removeFriend, searchUsers } from './handlers/social';
import { AccessUserRequest, AddFriendsRequest, CreatePartyRequest, DirectionsRequest, PartyModifcationRequest, SearchNearbyRequest } from './models/connection/requests';
import { setupSocketIO } from './handlers/socketio-ws';
import { getDirections, getETA, nearbyPlaces, searchPlaces } from './ext/gmaps';
import { Coordinates} from './models/geolocation';
import { error } from 'console';
import { UserDB } from './db/dbuser';

const app = express();

app.use(express.json());

const PORT = process.env.SERVER_PORT || 3010;

interface CreateUserReqeust {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
}

interface APIRequest {
    uri: string;
    time: number;
    limit: number;
    params: any;
    obj: any;
}

class RequestCache {
    private static instance: RequestCache;
    private cache: Map<string,APIRequest> = new Map();

    static getInstance(): RequestCache {
        if (!RequestCache.instance) {
            RequestCache.instance = new RequestCache();
        }
        return RequestCache.instance;
    }

    setCacheObject(key: string, limit: number, obj: any): void {
        const block: APIRequest = {uri: key, time: Date.now(), limit: limit, params: null, obj: obj};
        this.cache.set(key, block);
    }

    getObj(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && cached.obj ) {
            if (Date.now() - cached.time > cached.limit) {
                console.log(`${key} object has expired. Allowing new request`);
                this.cache.delete(key);
                return null;
            }
            console.log(`Returning cached ${key}: ${cached.obj}`);
            return cached.obj;
        }
        return null;
    }
}

app.post(ROUTES.CREATE_USER, async (req: Request, res: Response) => {
    const { firstName, lastName, email, username, password }: CreateUserReqeust = req.body;

    const result = await createUser(firstName, lastName, email, username, password);
    if (result.success) {
        res.status(result.code).json(result.user)
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.post(ROUTES.LOGIN_USER, async (req: Request, res: Response) => {
    const { username, password }: AccessUserRequest = req.body;

    const result = await loginUser(username, password);
    if (result.success) {
        res.status(result.code).json(result.user)
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.post(ROUTES.CREATE_PARTY, async (req: Request, res: Response) => {
    const { userID }: CreatePartyRequest = req.body;

    try {
        const result = await createParty(userID);
        
        if (result.success) {
            console.log(`Created party ${result.partyID} for host: ${userID}`);
            res.status(result.code).json(result.partyID);
        } else {
            console.log(`Failed to create party: ${result.error}`);
            res.status(result.code).json({
                error: result.error || 'Unknown error'
            });
        }
    } catch (error) {
        console.error('Unexpected error creating party:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

app.post(ROUTES.MODIFY_PARTY, async (req: Request, res: Response) => {
    const {userID, partyID, modification, properties}: PartyModifcationRequest = req.body;
    try {
        // if (data.user == undefined) {
        //     res.status(400).json({'error': 'Party modification properties must be given'})
        //     return
        // }
        const result = await modifyParty(userID, partyID, modification, properties)

        if (result.code === 200) {
            res.status(200).json({'message': `${modification} changed processed`})
        } else {
            res.status(result.code).json({'error': result.error})
        }

    } catch (error) {
        console.log('Unexpected error modifying party:', error);
        res.status(500).json({error: 'Internal server error'});
    }
})

// PARTY JOIN IN ws.ts

app.post(ROUTES.PARTY_STATUS, async (req: Request, res: Response) => {
    const { partyID, userID }: CreatePartyRequest = req.body;
    const result = getParty(userID, partyID)
    if (result.party) {
        res.status(200).json(result.party)
        return
    } else {
        res.status(result.code).json({'error': result.error})
        return
    }
})

app.post(ROUTES.ADD_FRIEND, async (req: Request, res: Response) => {
    const { username, friendUsername }: AddFriendsRequest = req.body;

    const result = await addFriend(username, friendUsername)
    if (result.added) {
        res.status(200).json()
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.post(ROUTES.REMOVE_FRIEND, async (req: Request, res: Response) => {
    const { username, friendUsername }: AddFriendsRequest = req.body;

    const result = await removeFriend(username, friendUsername)
    if (result.removed) {
        res.status(200).json()
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.post(ROUTES.GET_FRIENDS, async (req: Request, res: Response) => {
    const { username }: AddFriendsRequest = req.body;

    const result = await getFriends(username)
    if (result.friends && result.friends !== null) {
        res.status(200).json(result.friends.map(friend => friend.username))
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.get(ROUTES.SEARCH_USERS, async (req: Request, res: Response) => {
    const query = req.query.username as string;
    console.log("Search requested for query", query)
    const result = await searchUsers(query);
    if (result.success) {
        res.status(result.code).json(result.usernames);
    } else {
        res.status(result.code).json({ error: result.error });
    }
});

app.post(ROUTES.GET_DIRECTIONS, async (req: Request, res: Response) => {
    const directionsReq: DirectionsRequest = req.body;
    const response = await getDirections(directionsReq);


    const cachedObj = RequestCache.getInstance().getObj("DIRECTIONS");
    if (cachedObj) {
        res.status(200).json(cachedObj);
        return;
    }

    if (response.data) {
        // console.log(JSON.stringify(response.data, null, 2));
        console.log(`[${response.code}] Directions request successfully processed`)
        RequestCache.getInstance().setCacheObject("DIRECTIONS", 7000, response.data);
        res.status(200).json(response.data)
    } else {
        console.log(`[${response.code}] Failed processing directions request`)
        res.status(500).json({error: "could not perform request"})
    }
})

app.post(ROUTES.GET_ETA, async (req: Request, res: Response) => {
    const { origin, destination }: { origin: Coordinates, destination: Coordinates } = req.body;

    if (!origin || !destination || !origin.lat || !origin.long || !destination.lat || !destination.long) {
        res.status(400).json({ error: "Origin and destination coordinates must be provided" });
        return
    }

    const { lat: originLat, long: originLong } = origin;
    const { lat: destLat, long: destLong } = destination;

    const cachedObj = RequestCache.getInstance().getObj("ETA")
    if (cachedObj) {
        res.status(200).json(cachedObj);
        return;
    }

    const duration = await getETA(new Coordinates(originLat, originLong), new Coordinates(destLat, destLong))
    if (duration != -1) {
        RequestCache.getInstance().setCacheObject("ETA", 3000, duration)
        res.status(200).json(duration);
        return;
    }

    res.status(500);
    return;
})

app.post(ROUTES.FEED_PLACES, async (req: Request, res: Response) => {
    const {preferences, lat, long }: SearchNearbyRequest = req.body;
    if (preferences && (!Array.isArray(preferences) || !preferences.every(item => typeof item === 'string'))) {
        res.status(400).json({ error: "preferences not formatted as string array" });
        return
    }

    if (!lat || !long) {
        res.status(400).json({error: "Origin lat/long must be provided"})
        return
    }
    const places = await nearbyPlaces(new Coordinates(lat, long), preferences)

    if (places.data) {
        console.log(`[${places.code}] Nearby Feed request successfully processed`)
        res.status(200).json(places.data)
    } else {
        console.log(`[${places.code}] Failed processing nearby feed request`)
        res.status(places.code).json({error: places.error})
    }
})

app.post(ROUTES.SEARCH_PLACES, async (req: Request, res: Response) => {
    const { query }: any = req.body;
    const { lat, long }: Coordinates = req.body;

    if (!lat || !long) {
        res.status(400).json({error: "User location coordinate bias must be provided"})
        return
    }

    if (!query) {
        res.status(400).json({error: "Query cannot be empty"})
        return
    }
    const places = await searchPlaces(query, new Coordinates(lat, long))

    if (places.data) {
        console.log(`[${places.code}] Places Search successfully processed`)
        res.status(200).json({places})
    } else {
        console.log(`[${places.code}] Failed processing Search Places request`)
        res.status(places.code).json({error: places.error})
    }
})

// TEST AXIOS(USE FOR LOCATION REPLACE URL)
app.get("/fetch", async (req: Request, res: Response) => {
    try {
        const response = await axios.get("https://jsonplaceholder.typicode.com/posts")

        res.json({
            message: 'Data fetched successfully!',
            data: response.data,
        });
        return
    } catch (error) {
        console.log(error);
    }
})

app.get("/ping", async (req: Request, res: Response) => {
    console.log(`Sending PONG from worker ${process.pid}`);
    res.status(200).json({
        "message": "pong"
    })
})

app.get("/users/all", async (req: Request, res: Response) => {
    const users = await UserDB.dbAllUsers();
    res.status(200).json(users);
})

if (cluster.isPrimary) {
    // const numCPUs = os.cpus().length;
    const numCPUs = 1;
    console.log(`Master process up, forking ${numCPUs} workers`);
    
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });

} else {
    const server = app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });

    setupSocketIO(server);
    connectDB();

    server.setTimeout(0);
}
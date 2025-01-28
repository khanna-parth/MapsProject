import cluster from 'cluster';
import axios from 'axios';
import express, { Request, Response } from 'express';
import { createParty, getParty  } from './handlers/party';
import ROUTES from './routes/routes';
import { createUser, loginUser } from './handlers/auth';
import { connectDB } from './db/client';
import { addFriend, getFriends, removeFriend } from './handlers/social';
import { AccessUserRequest, AddFriendsRequest, CreatePartyRequest } from './models/connection/requests';
import { setupSocketIO } from './handlers/socketio-ws';

const app = express();

app.use(express.json());

const PORT = process.env.SERVER_PORT || 3010;

app.post(ROUTES.CREATE_USER, async (req: Request, res: Response) => {
    const { username, password }: AccessUserRequest = req.body;

    const result = await createUser(username, password);
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
    const { partyID, userID }: CreatePartyRequest = req.body;

    const result = createParty(partyID, userID);
    if (result.success) {
        console.log(`Created party with id ${partyID} for host: ${userID}`)
        res.status(result.code).json({'message': `Party with id ${partyID} was created`})
    } else {
        console.log(`Error creating party: ${result.error}`)
        res.status(result.code).json({'error': result.error})
    }
})

// PARTY JOIN IN ws.ts

app.post(ROUTES.PARTY_STATUS, async (req: Request, res: Response) => {
    const { partyID, userID }: CreatePartyRequest = req.body;

    const result = getParty(userID, partyID)
    if (result.party) {
        res.status(200).json(result.party)
    } else {
        res.status(result.code).json({'error': result.error})
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

// TEST AXIOS(USE FOR LOCATION REPLACE URL)
app.get("/fetch", async (req: Request, res: Response) => {
    try {
        const response = await axios.get("https://jsonplaceholder.typicode.com/posts")

        res.json({
            message: 'Data fetched successfully!',
            data: response.data,
        });
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

    // const io = new Server(server,{});

    // io.on("connection", (socket) => {
    //     console.log("Recieved connection")

    //     socket.on("message", function(msg) {
    //         console.log(`Message recieved: ${msg}`)
    //         io.emit("message", msg);
    //     }
    // )});
    
    // setupWebSocket(server);
    connectDB();

    // server.listen(Number(PORT), '127.0.0.1', () => {
    //     console.log(`Server running at http://localhost:${PORT} in worker ${process.pid}`);
    //   });
    server.setTimeout(0);
}
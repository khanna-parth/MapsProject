import axios from 'axios';
import express, { Request, Response } from 'express';
import { createParty, getParty  } from './handlers/party';
import { setupWebSocket } from './handlers/ws';
import ROUTES from './routes/routes';
import { createUser, loginUser } from './handlers/auth';
import { connectDB } from './db/client';
import { addFriend, getFriends, removeFriend } from './handlers/social';
import { AccessUserRequest, AddFriendsRequest, CreatePartyRequest } from './models/connection/requests';

const app = express();

app.use(express.json());
const PORT = process.env.PORT || 3000;

app.post(ROUTES.CREATE_USER, async (req: Request, res: Response) => {
    const { username, password }: AccessUserRequest = req.body;

    const result = await createUser(username, password);
    if (result.success) {
        res.status(result.code).json(result.user)
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.get(ROUTES.LOGIN_USER, async (req: Request, res: Response) => {
    const { username, password }: AccessUserRequest = req.body;

    const result = await loginUser(username, password);
    if (result.success) {
        res.status(result.code).json(result.user)
    } else {
        res.status(result.code).json({'error': result.error})
    }
})


app.post(ROUTES.CREATE_PARTY, (req: Request, res: Response) => {
    const { partyID, userID }: CreatePartyRequest = req.body;

    const result = createParty(partyID, userID);
    if (result.success) {
        res.status(result.code).json({'message': `Party with id ${partyID} was created`})
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.get(ROUTES.PARTY_STATUS, (req: Request, res: Response) => {
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


const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

setupWebSocket(server);
connectDB();

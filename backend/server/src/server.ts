import axios from 'axios';
import express, { Request, Response } from 'express';
import { createParty, getParty  } from './handlers/party';
import { setupWebSocket } from './handlers/ws';
import { CreatePartyRequest, AccessUserRequest } from './models/connection/requests';
import { CREATE_USER_ROUTE, LOGIN_USER_ROUTE, CREATE_PARTY_ROUTE, PARTY_STATUS_ROUTE } from './routes/routes';
import { createUser, loginUser } from './handlers/auth';
import { pool } from './models/pool';

const app = express();

app.use(express.json());
const PORT = process.env.PORT || 3000;

app.post(CREATE_USER_ROUTE, async (req: Request, res: Response) => {
    const { username, password }: AccessUserRequest = req.body;

    const result = await createUser(username, password);
    if (result.success) {
        res.status(result.code).json(result.user)
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.get(LOGIN_USER_ROUTE, async (req: Request, res: Response) => {
    const { username, password }: AccessUserRequest = req.body;

    const result = await loginUser(username, password);
    if (result.success) {
        res.status(result.code).json(result.user)
    } else {
        res.status(result.code).json({'error': result.error})
    }
})


app.post(CREATE_PARTY_ROUTE, (req: Request, res: Response) => {
    const { partyID, userID }: CreatePartyRequest = req.body;

    const result = createParty(partyID, userID);
    if (result.success) {
        res.status(result.code).json({'message': `Party with id ${partyID} was created`})
    } else {
        res.status(result.code).json({'error': result.error})
    }
})

app.get(PARTY_STATUS_ROUTE, (req: Request, res: Response) => {
    const { partyID, userID }: CreatePartyRequest = req.body;

    const result = getParty(userID, partyID)
    if (result.party) {
        res.status(200).json(result.party)
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

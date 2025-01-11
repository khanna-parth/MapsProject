import axios from 'axios';
import express, { Request, Response } from 'express';
import { createParty, getParties  } from './handlers/party';
import { setupWebSocket } from './handlers/ws';
import { CreatePartyRequest } from './models/connection/requests';
import { CREATE_PARTY_ROUTE, LIST_PARTY_ROUTE } from './routes/routes';

const app = express();

app.use(express.json());
const PORT = process.env.PORT || 3000;


app.post(CREATE_PARTY_ROUTE, (req: Request, res: Response) => {
    const { partyID, userID }: CreatePartyRequest = req.body;

    if (typeof partyID !== 'string' || partyID.trim() === '') {
        res.status(400).json({ error: 'partyID must be properly specified' });
        return;
    }

    if (typeof userID !== 'string' || userID.trim() === '') {
        res.status(400).json({ error: 'userID must be properly specified' });
        return
    }

    const result = createParty(partyID);
    if (result.success) {
        res.status(201).json({'message': `Party with id ${partyID} was created`})
    } else {
        res.status(400).json({'message': result.error})
    }
})

app.get(LIST_PARTY_ROUTE, (req: Request, res: Response) => {
    res.status(200).json({'parties': getParties()})
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

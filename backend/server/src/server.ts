import express, { Request, Response } from 'express';
import axios from 'axios';
import { createParty, getParty } from './handlers/party';
import { setupWebSocket } from './handlers/ws';
import ROUTES from './routes/routes';
import { createUser, loginUser } from './handlers/auth';
import db from './database/models';
import { addFriend, getFriends, removeFriend } from './handlers/social';
import {
  AccessUserRequest,
  AddFriendsRequest,
  CreatePartyRequest,
} from './types/models';

const app = express();
app.use(express.json());

const PORT = process.env.SERVER_PORT || 3010;

// Route to create a user
app.post(ROUTES.CREATE_USER, async (req: Request, res: Response) => {
  try {
    const { username, password }: AccessUserRequest = req.body;
    const result = await createUser(username, password);

    if (result.success) {
      res.status(result.code).json(result.user);
    } else {
      res.status(result.code).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to log in a user
app.post(ROUTES.LOGIN_USER, async (req: Request, res: Response) => {
  try {
    const { username, password }: AccessUserRequest = req.body;
    const result = await loginUser(username, password);

    if (result.success) {
      res.status(result.code).json(result.user);
    } else {
      res.status(result.code).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to create a party
app.post(ROUTES.CREATE_PARTY, async (req: Request, res: Response) => {
  try {
    const { partyID, userID }: CreatePartyRequest = req.body;
    const result = await createParty(partyID, userID);

    if (result.success) {
      res.status(result.code).json({ message: `Party with id ${partyID} was created` });
    } else {
      res.status(result.code).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error creating party:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to get party status
app.get(ROUTES.PARTY_STATUS, async (req: Request, res: Response) => {
  try {
    const { partyID, userID }: CreatePartyRequest = req.query as unknown as CreatePartyRequest;
    const result = await getParty(userID, partyID);

    if (result.party) {
      res.status(200).json(result.party);
    } else {
      res.status(result.code).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error retrieving party status:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to add a friend
app.post(ROUTES.ADD_FRIEND, async (req: Request, res: Response) => {
  try {
    const { username, friendUsername }: AddFriendsRequest = req.body;
    const result = await addFriend(username, friendUsername);

    if (result.added) {
      res.status(200).json({ message: 'Friend added successfully.' });
    } else {
      res.status(result.code).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to remove a friend
app.post(ROUTES.REMOVE_FRIEND, async (req: Request, res: Response) => {
  try {
    const { username, friendUsername }: AddFriendsRequest = req.body;
    const result = await removeFriend(username, friendUsername);

    if (result.removed) {
      res.status(200).json({ message: 'Friend removed successfully.' });
    } else {
      res.status(result.code).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to get friends
app.post(ROUTES.GET_FRIENDS, async (req: Request, res: Response) => {
  try {
    const { username }: AddFriendsRequest = req.body;
    const result = await getFriends(username);

    if ('friends' in result && result.friends) {
      res.status(200).json(result.friends.map((friend) => friend.username));
    } else {
      res.status(result.code).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error retrieving friends:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Test route for Axios
app.get('/fetch', async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
    res.json({
      message: 'Data fetched successfully!',
      data: response.data,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data.' });
  }
});

// Start server and connect to the database
const server = app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established.');
    await db.sequelize.sync();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
});

// Initialize WebSocket
setupWebSocket(server);

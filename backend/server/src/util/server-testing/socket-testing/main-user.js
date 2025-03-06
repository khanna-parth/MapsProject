import io from 'socket.io-client';
import axios from 'axios';

let initData = {
    "userID": "32ba5ef2-c7ce-42fe-b1e9-1cfcf7397f70"
};

async function createParty() {
    try {
        const resp = await axios.post("http://localhost:3010/party/create", initData);
        
        if (resp.status !== 201) {
            console.log(`Failed to create party to test socket: ${resp.status} ${resp.data} ${resp.error}`);
            process.exit(0);
        }

        console.log(`Party created successfully with ID: ${resp.data}`);
        return resp.data;
    } catch (error) {
        console.error('Error creating party:', error);
        process.exit(0);
    }
}

async function sendMessage(socket, partyID) {
    try {
        const params = {userID: String(initData.userID), partyID: String(partyID)}
        const resp = await axios.post('http://localhost:3010/party/status', params);
        if (resp.status !== 200) {
            return;
        }
        if (resp.data.connected && resp.data.connected.length > 0) {
            const randLat = Math.floor(Math.random() * 100) + 1;
            const randLong = Math.floor(Math.random() * 100) + 1;
            socket.emit('location', ({lat: randLat, long: randLong}));
        } else {
            console.log(resp.data);
        }
        
        console.log(resp.data);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function startSocketCommunication(partyID) {
    const socket = io('http://localhost:3010', {
        path: "/party/join",
        transports: ['websocket'],
        query: {
            userID: '32ba5ef2-c7ce-42fe-b1e9-1cfcf7397f70',
            partyID: partyID
        }
    });

    console.log('Connecting to socket...');

    socket.on('connect', () => {
        console.log('Connected to the server');
        socket.emit('message', 'Hello, I am testing a message!');
    });

    socket.on('connections', (msg) => {
        console.log(msg);
    });

    socket.on('message', (msg) => {
        console.log('Message from server:', msg);
    });

    socket.on('ALERT', (msg) => {
        console.log(`ALERT: ${msg}`);
    });

    socket.on('error', (err) => {
        console.error('Error:', err);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    setInterval(() => {
        sendMessage(socket, partyID);
    }, 5000);
}

async function main() {
    try {
        const partyID = await createParty();
        await startSocketCommunication(partyID);
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

main();

import io from 'socket.io-client';
import axios from 'axios';

let initData = {
    "userID": "9b38e01a-1b43-4ad0-9947-12d41b9ee77b",
    "username": "mainUser"
};

async function createParty() {
    try {
        const resp = await axios.post("http://localhost:3020/party/create", initData);
        
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
        const randLat = Math.floor(Math.random() * 100) + 1;
        const randLong = Math.floor(Math.random() * 100) + 1;
        socket.emit('location', ({lat: randLat, long: randLong}));
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// async function sendMessage(socket, partyID) {
//     try {
//         const params = {userID: String(initData.userID), partyID: String(partyID)}
//         const resp = await axios.post('http://localhost:3020/party/status', params);
//         if (resp.status !== 200) {
//             return;
//         }
//         if (resp.data.connected && resp.data.connected.length > 0) {
//             const randLat = Math.floor(Math.random() * 100) + 1;
//             const randLong = Math.floor(Math.random() * 100) + 1;
//             socket.emit('location', ({lat: randLat, long: randLong}));
//         } else {
//             // console.log(resp.data);
//         }
        
//         console.log(resp.data);
//     } catch (error) {
//         console.error('Error sending message:', error);
//     }
// }

async function startSocketCommunication(partyID) {
    const socket = io('http://localhost:3020', {
        path: "/party/join",
        // path: "/socket.io",
        transports: ['websocket'],
        query: {
            userID: initData.userID,
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

    socket.on('alert', (msg) => {
        console.log(`ALERT: ${msg}`);
    });

    socket.on('error', (err) => {
        console.error('Error:', err);
    });

    socket.on('location', (msg) => {
        console.log('New location event:', msg);
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

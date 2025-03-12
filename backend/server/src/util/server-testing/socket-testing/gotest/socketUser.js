import io from 'socket.io-client';
import axios from 'axios';

const args = process.argv.slice(2);

const userIDArg = args[0];
if (!userIDArg || userIDArg.length == 0) {
    console.log(`Invalid userID argument: '${userIDArg}'`);
    process.exit(0);
}

const partyIDArg = args[1];
if (!partyIDArg || partyIDArg.length == 0) {
    console.log(`Invalid partyID argument: '${partyIDArg}'`);
    process.exit(0);
}

const portArg = args[2];
if (!portArg || portArg.length == 0) {
    console.log(`Invalid portArg argument: '${portArg}'`);
    process.exit(0);
}

async function sendMessage(socket, partyID) {
    try {
        const randLat = Math.floor(Math.random() * 100) + 1;
        const randLong = Math.floor(Math.random() * 100) + 1;
        socket.emit('location', ({lat: randLat, long: randLong}));
        console.log("Sent loc update")
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

console.log(`Connecting to ${partyIDArg} using userID ${userIDArg}`);
const socket = io(`http://localhost:${portArg}`, {
    path: "/party/join",
    transports: ['websocket'],
    query: {
        userID: userIDArg,
        partyID: partyIDArg,
    }
});

console.log(`Tried`)

socket.on('connect', () => {
    console.log('Connected to the server');
    socket.emit('message', 'Hello, I am testing a message!');

    setInterval(() => {
        sendMessage(socket, partyIDArg);
    }, 5000)
});

socket.on('location', (msg) => {
    console.log('New location event:', msg);
});

socket.on('alert', (msg) => {
    console.log('New alert event:', msg);
});
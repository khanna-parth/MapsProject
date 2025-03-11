//TESTING: node socketio-testing.js

import io from 'socket.io-client';
import axios from 'axios';

const args = process.argv.slice(2);

async function sendMessage(socket, partyID) {
    try {
        const randLat = Math.floor(Math.random() * 100) + 1;
        const randLong = Math.floor(Math.random() * 100) + 1;
        socket.emit('location', ({lat: randLat, long: randLong}));
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

const userIDArg = args[0];
if (!userIDArg || userIDArg.length == 0) {
    console.log(`Invalid userID argument: '${partyIDArg}'`);
    process.exit(0);
}

const partyIDArg = args[1];
if (!partyIDArg || partyIDArg.length == 0) {
    console.log(`Invalid partyID argument: '${partyIDArg}'`);
    process.exit(0);
}

console.log(`Connecting to ${partyIDArg} using userID ${userIDArg}`);
const socket = io('http://localhost:3020', {
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

// socket.on('connections', (msg) => {
//     console.log(msg);
// });

// socket.on('message', (msg) => {
//     console.log('Message from server:', msg);
// });

socket.on('location', (msg) => {
    console.log('New location event:', msg);
});

// socket.on('INTERNAL', (msg) => {
//     console.log('INTERNAL alert:', msg);
// });

// socket.on('ALERT', (msg) => {
//     console.log(`ALERT: ${msg}`)
// })

// socket.on('error', (err) => {
//     console.error('Error:', err);
// });

// socket.on('disconnect', () => {
//     console.log('Disconnected from server');
// });

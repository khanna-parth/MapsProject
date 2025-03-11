//TESTING: node socketio-testing.js

import io from 'socket.io-client';
import axios from 'axios';

const args = process.argv.slice(2);

const partyIDArg = args[0];
if (!partyIDArg || partyIDArg.length == 0) {
    console.log(`Invalid partyID argument: '${partyIDArg}'`);
    process.exit(0);
}

const data = {
    "userID": "230a7b59-ba46-4972-9a73-eec7baa7b4bc"
}

console.log(`Connecting`)
const socket = io('http://localhost:3010', {
    path: "/party/join",
    transports: ['websocket'],
    query: {
        userID: data.userID,
        partyID: partyIDArg,
    }
});

console.log(`Tried`)

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

socket.on('location', (msg) => {
    console.log('New location event:', msg);
});

socket.on('INTERNAL', (msg) => {
    console.log('INTERNAL alert:', msg);
});

socket.on('ALERT', (msg) => {
    console.log(`ALERT: ${msg}`)
})

socket.on('error', (err) => {
    console.error('Error:', err);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

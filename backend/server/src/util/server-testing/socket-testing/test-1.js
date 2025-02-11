//TESTING: node socketio-testing.js

import io from 'socket.io-client';
import axios from 'axios';

const data = {
    "userID": "32ba5ef2-c7ce-42fe-b1e9-1cfcf7397f70"
}
const resp = await axios.post("http://localhost:3010/party/create", data);

if (resp.status !== 201) {
    console.log(`Failed to create party to test socket: ${resp.status} ${resp.data} ${resp.error}`);
    process.exit(0);
}

console.log(`Connecting`)
const socket = io('http://localhost:3010', {
    path: "/party/join",
    transports: ['websocket'],  // Force WebSocket transport
    query: {
        userID: data.userID,
        partyID: resp.data
    }
});

console.log(`Tried`)

socket.on('connect', () => {
    console.log('Connected to the server');
    socket.emit('message', 'Hello, I am testing a message!');
});

socket.on('connected', (msg) => {
    console.log("Connected")
    console.log(msg);
});

socket.on('message', (msg) => {
    console.log('Message from server:', msg);
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

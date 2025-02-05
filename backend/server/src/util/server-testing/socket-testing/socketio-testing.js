//TESTING: node socketio-testing.js

const io = require('socket.io-client');

console.log(`Connecting`)
// const socket = io('http://localhost:3010')
const socket = io('http://localhost:3010', {
    path: "/party/join",
    transports: ['websocket'],  // Force WebSocket transport
    query: {
        // userID: '9029a653-92d3-4dd6-810e-88647fd483f3',
        // userID: '77c77fce-03e1-48f1-b367-eb9fc03c5f38'
        userID: '77c77fce-03e1-48f1-b367-eb9fc03c5f38',
        partyID: '502785'
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

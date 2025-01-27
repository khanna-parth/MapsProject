import io from 'socket.io-client';

console.log(`Connecting`)
// const socket = io('http://localhost:3010')
const socket = io('http://localhost:3010/?partyID=1&userID=f17e28c9-f3bb-4b3e-b075-d804c6c1fd60')
// const socket = io('http://localhost:3010/send')

console.log(`Tried`)
// socket.on('connection', () => {
//     console.log('Connected to the server');
//     socket.emit('message', 'Hello, I am testing a message!');
// });

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

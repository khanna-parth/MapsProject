const io = require('socket.io-client');
const axios = require('axios');

const userID = '77c77fce-03e1-48f1-b367-eb9fc03c5f38';
let partyID = '';

const testDestinations = [
    {
        name: "San Francisco Downtown",
        address: "San Francisco, CA",
        coordinates: { lat: 37.7749, long: -122.4194 },
        addedBy: userID
    },
    {
        name: "UC Davis",
        address: "1 Shields Ave, Davis, CA 95616",
        coordinates: { lat: 38.5382, long: -121.7617 },
        addedBy: userID
    }
];

function parseSocketMessage(msg) {
    try {
        // Remove the "SYSTEM: " prefix if it exists
        const jsonStr = msg.startsWith('SYSTEM: ') ? msg.substring(8) : msg;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Error parsing message:', error);
        return null;
    }
}

async function createParty() {
    try {
        console.log('Creating party...');
        const resp = await axios.post("http://localhost:3010/party/create", { userID });
        if (resp.status !== 201) throw new Error('Party creation failed');
        console.log('Party created successfully with ID:', resp.data);
        return resp.data;
    } catch (error) {
        console.error('Error creating party:', error);
        process.exit(1);
    }
}

async function startSocketCommunication(partyID) {
    const socket = io('http://localhost:3010', {
        path: "/party/join",
        transports: ['websocket'],
        query: {
            userID,
            partyID
        }
    });

    console.log('Connecting to socket...');

    // Track if we've already performed certain actions
    let hasRemovedDestination = false;
    let hasSetCurrentDestination = false;

    socket.on('connect', () => {
        console.log('Connected to the server');
        
        // Add test destinations after connection
        setTimeout(() => {
            console.log('Adding test destinations...');
            testDestinations.forEach(destination => {
                socket.emit('add-destination', destination);
            });
        }, 1000);
    });

    socket.on('shared-destinations', (data) => {
        const parsed = parseSocketMessage(data);
        if (parsed) {
            console.log('Received shared destinations update:', parsed);

            // Remove first destination after destinations are added
            if (!hasRemovedDestination && parsed.destinations.length === 2) {
                console.log('Removing first destination...');
                socket.emit('remove-destination', parsed.destinations[0].id);
                hasRemovedDestination = true;
            }

            // Set current destination after removal
            if (hasRemovedDestination && !hasSetCurrentDestination && parsed.destinations.length === 1) {
                console.log('Setting current destination...');
                socket.emit('set-current-destination', parsed.destinations[0].id);
                hasSetCurrentDestination = true;
            }
        }
    });

    socket.on('connections', (msg) => {
        console.log('Connection event:', msg);
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

async function main() {
    try {
        partyID = await createParty();
        await startSocketCommunication(partyID);
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

main(); 
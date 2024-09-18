require('dotenv').config();
const express = require('express');
const { CosmosClient } = require('@azure/cosmos');
const http = require('http'); 
const socketIO = require('socket.io'); 


const app = express();
const server = http.createServer(app); 
const io = socketIO(server); 


const endpoint = process.env.COSMOS_DB_ENDPOINT; 
const key = process.env.COSMOS_DB_KEY; 
const client = new CosmosClient({ endpoint, key });
const databaseId = 'chatdb';
const containerId = 'messages';
const container = client.database(databaseId).container(containerId);


async function storeMessage(msg) {
    await container.items.create(msg); 
}


const PORT = process.env.PORT || 3000;


app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


io.on('connection', (socket) => {
    console.log('A user connected');

    
    container.items.query('SELECT * from c ORDER BY c._ts DESC').fetchAll().then(result => {
        result.resources.forEach(msg => {
            socket.emit('message', msg); 
        });
    }).catch(error => console.error('Error retrieving messages:', error));

    
    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg); 
        storeMessage(msg); 
    });

    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

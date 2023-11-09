// backend/server.js
const express = require('express');
const amqp = require('amqplib');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// RabbitMQ connection
const connect = async () => {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'messages';

    await channel.assertQueue(queue, { durable: false });

    return channel;
};

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket connected');

    ws.on('close', () => {
        console.log('WebSocket disconnected');
    });
});

// API endpoint to send a message
app.post('/send', async (req, res) => {
    const { message } = req.body;

    const channel = await connect();
    channel.sendToQueue('messages', Buffer.from(message));

    // Notify connected clients about the new message
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', content: message }));
        }
    });

    res.json({ status: 'Message sent' });
});

// API endpoint to fetch messages
app.get('/messages', async (req, res) => {
    const channel = await connect();

    const queue = 'messages';
    const messages = [];

    // Keep fetching messages until the queue is empty
    while (true) {
        const message = await channel.get(queue);
        if (!message) break;

        messages.push(message.content.toString());
    }

    res.json({ messages });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

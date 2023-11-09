// frontend/src/App.js
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [sentMessages, setSentMessages] = useState([]);

    const sendMessage = async () => {
        try {
            await axios.post('http://localhost:3001/send', { message });
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error.message);
            setResponse('Error sending message');
        }
    };

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'message') {
                setSentMessages((prevMessages) => [...prevMessages, data.content]);
            }
        };

        return () => {
            ws.close();
        };
    }, []); // Empty dependency array to establish the WebSocket connection once when the component mounts

    return (
        <div>
            <h1>Message Queue App</h1>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: 1 }}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter your message"
                    />
                    <button onClick={sendMessage}>Send Message</button>
                    <p>{response}</p>
                </div>
                <div style={{ flex: 1, marginLeft: '20px' }}>
                    <h2>Sent Messages</h2>
                    <ul>
                        {sentMessages.map((sentMessage, index) => (
                            <li key={index}>{sentMessage}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default App;

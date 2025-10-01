const WebSocket = require('ws');
const net = require('net');
const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Proxy server is running');
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
    server: server,
    path: '/mqtt'
});

console.log('🚀 MQTT-over-WebSocket Proxy Server starting...');

wss.on('connection', function connection(ws, request) {
    console.log('🔌 New WebSocket client connected from:', request.socket.remoteAddress);
    
    const connectionId = Date.now() + Math.random().toString(36).substr(2, 9);
    let tcpClient = null;

    // First, accept the WebSocket connection properly
    ws.on('message', function incoming(message) {
        if (tcpClient && !tcpClient.destroyed) {
            // Forward WebSocket message directly to TCP
            tcpClient.write(message);
        }
    });

    // Then connect to the actual MQTT broker
    try {
        tcpClient = net.createConnection({
            host: '5.tcp.ngrok.io',
            port: 27483
        }, () => {
            console.log('✅ Connected to TCP MQTT broker for connection:', connectionId);
        });

        tcpClient.on('data', (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                // Forward TCP data directly to WebSocket
                ws.send(data);
            }
        });

        tcpClient.on('error', (error) => {
            console.error('❌ TCP connection error:', error.message);
            ws.close();
        });

        tcpClient.on('close', () => {
            console.log('🔌 TCP connection closed');
            ws.close();
        });

        ws.on('close', () => {
            console.log('🔌 WebSocket client disconnected');
            if (tcpClient) tcpClient.end();
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            if (tcpClient) tcpClient.end();
        });

    } catch (error) {
        console.error('❌ Failed to create TCP connection:', error);
        ws.close();
    }
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log('✅ Proxy server running on port', PORT);
    console.log('📡 WebSocket URL: ws://localhost:' + PORT + '/mqtt');
    console.log('🔗 Proxying to: tcp://5.tcp.ngrok.io:27483');
});
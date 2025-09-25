const WebSocket = require('ws');
const net = require('net');
const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end('Proxy server is running');
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
    server,
    path: '/mqtt'
});

// Store active connections
const activeConnections = new Map();

wss.on('connection', function connection(ws, request) {
    console.log('🔌 New WebSocket client connected:', request.socket.remoteAddress);
    
    const connectionId = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Connect to TCP MQTT broker
    const tcpClient = net.createConnection({
        host: '5.tcp.ngrok.io',
        port: 27483
    }, () => {
        console.log('✅ Connected to TCP MQTT broker for connection:', connectionId);
        activeConnections.set(connectionId, { ws, tcpClient });
        
        // Send connection acknowledgement
        ws.send(JSON.stringify({
            type: 'connected',
            connectionId: connectionId,
            message: 'Connected to MQTT broker via proxy'
        }));
    });

    // Handle WebSocket messages - forward to TCP as binary data
    ws.on('message', function incoming(message) {
        try {
            console.log('📤 WebSocket -> TCP [%s]:', connectionId, message.length, 'bytes');
            
            if (tcpClient && !tcpClient.destroyed) {
                // Forward as binary data (MQTT protocol uses binary)
                if (message instanceof Buffer) {
                    tcpClient.write(message);
                } else if (typeof message === 'string') {
                    // Convert string to buffer
                    tcpClient.write(Buffer.from(message));
                } else {
                    // Convert to buffer
                    tcpClient.write(Buffer.from(message));
                }
            }
        } catch (error) {
            console.error('❌ Error processing WebSocket message:', error);
        }
    });

    // Handle TCP data - forward to WebSocket as binary
    tcpClient.on('data', function(data) {
        try {
            console.log('📥 TCP -> WebSocket [%s]:', connectionId, data.length, 'bytes');
            
            if (ws.readyState === WebSocket.OPEN) {
                // Forward as binary data
                ws.send(data);
            }
        } catch (error) {
            console.error('❌ Error processing TCP data:', error);
        }
    });

    // Handle WebSocket close
    ws.on('close', (code, reason) => {
        console.log('🔌 WebSocket client disconnected [%s]:', connectionId, code, reason.toString());
        if (tcpClient && !tcpClient.destroyed) {
            tcpClient.end();
        }
        activeConnections.delete(connectionId);
    });

    // Handle TCP connection close
    tcpClient.on('close', (hadError) => {
        console.log('🔌 TCP connection closed [%s], error:', connectionId, hadError);
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
        activeConnections.delete(connectionId);
    });

    // Handle errors
    tcpClient.on('error', (err) => {
        console.error('❌ TCP connection error [%s]:', connectionId, err);
        if (ws.readyState === WebSocket.OPEN) {
            ws.close(1011, 'TCP connection error');
        }
        activeConnections.delete(connectionId);
    });

    ws.on('error', (err) => {
        console.error('❌ WebSocket error [%s]:', connectionId, err);
        if (tcpClient && !tcpClient.destroyed) {
            tcpClient.end();
        }
        activeConnections.delete(connectionId);
    });
});

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down proxy server...');
    activeConnections.forEach((connection, id) => {
        if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.close(1000, 'Server shutdown');
        }
        if (connection.tcpClient && !connection.tcpClient.destroyed) {
            connection.tcpClient.end();
        }
    });
    server.close(() => {
        console.log('✅ Proxy server shut down gracefully');
        process.exit(0);
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log('🚀 WebSocket MQTT Proxy Server running on port', PORT);
    console.log('📡 WebSocket URL: ws://localhost:' + PORT + '/mqtt');
    console.log('🔗 Proxying to: tcp://5.tcp.ngrok.io:27483');
    console.log('❤️  Health check: http://localhost:' + PORT + '/health');
});
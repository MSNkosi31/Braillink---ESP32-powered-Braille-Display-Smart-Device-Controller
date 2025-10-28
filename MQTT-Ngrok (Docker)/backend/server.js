require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');

// --- Local imports ---
const Device = require('./models/Device');
const deviceRoutes = require('./routes/devices');
const routineRoutes = require('./routes/routines');

// --- Express app setup ---
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const MQTT_URL = 'mqtt://mqtt:1883';
const REQ_TOPIC = 'deviceList';
const RES_TOPIC = 'deviceList/response';

// --- Create HTTP server (Express + WebSocket use same server) ---
const server = http.createServer(app);

// ============================================================
// 🔌 MQTT-over-WebSocket Proxy Integration
// ============================================================

console.log('🚀 MQTT-over-WebSocket Proxy Server initializing...');

const wss = new WebSocket.Server({
  server: server,
  path: '/mqtt'
});

wss.on('connection', function connection(ws, request) {
  console.log('🔌 New WebSocket client connected from:', request.socket.remoteAddress);
  
  const connectionId = Date.now() + Math.random().toString(36).substr(2, 9);
  let tcpClient = null;

  ws.on('message', function incoming(message) {
    if (tcpClient && !tcpClient.destroyed) {
      tcpClient.write(message);
    }
  });

  try {
    tcpClient = net.createConnection({
      host: '10.tcp.eu.ngrok.io', // Replace with your ngrok host or broker
      port: 25115
    }, () => {
      console.log('✅ Connected to TCP MQTT broker for connection:', connectionId);
    });

    tcpClient.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
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

// --- Health route for WebSocket proxy ---
app.get('/health', (_req, res) => {
  res.status(200).send('Proxy server is running');
});

// ============================================================
// 🧠 MongoDB + MQTT Logic
// ============================================================

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const mqttClient = mqtt.connect(MQTT_URL);
mqttClient.on('connect', () => {
  console.log('✅ MQTT connected to', MQTT_URL);
  mqttClient.subscribe(REQ_TOPIC, (err) => {
    if (err) console.error('Failed to subscribe:', err);
    else console.log(`📡 Subscribed to "${REQ_TOPIC}"`);
  });
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT error:', err);
});

// --- Handle device list requests from MQTT ---
mqttClient.on('message', async (topic, payload) => {
  if (topic !== REQ_TOPIC) return;

  try {
    const devices = await Device.find().lean();
    const roomMap = {};

    devices.forEach(d => {
      const room = d.roomName || "Unassigned";
      if (!roomMap[room]) roomMap[room] = [];
      roomMap[room].push(d.deviceName);
    });

    const roomStrings = Object.keys(roomMap).map(roomName => {
      return `${roomName}-${roomMap[roomName].join(';')}`;
    });

    const payloadStr = roomStrings.join(',');
    mqttClient.publish(RES_TOPIC, payloadStr, { qos: 0 }, (err) => {
      if (err) console.error('Publish error:', err);
      else console.log(`✅ Published: ${payloadStr}`);
    });

  } catch (e) {
    console.error('❌ Failed to fetch/publish devices:', e);
    mqttClient.publish(RES_TOPIC, `ERROR: ${e.message || 'Unknown error'}`, { qos: 0 });
  }
});

// ============================================================
// 🌍 Express API Routes
// ============================================================

app.use('/api/devices', deviceRoutes);
app.use('/api/routines', routineRoutes);

app.get('/', (_req, res) => {
  res.send('Device API, MQTT middleman & WebSocket proxy are running');
});

// ============================================================
// 🚀 Start unified server
// ============================================================

server.listen(PORT,() => {
  console.log('✅ Server running on port', PORT);
  console.log('🌐 HTTP API: http://localhost:' + PORT);
  console.log('📡 WebSocket URL: ws://localhost:' + PORT + '/mqtt');
  console.log('🔗 Proxying to TCP broker: tcp://5.tcp.ngrok.io:27483');
});

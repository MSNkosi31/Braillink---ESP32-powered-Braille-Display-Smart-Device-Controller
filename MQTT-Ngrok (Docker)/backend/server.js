require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const cors = require('cors');

const Device = require('./models/Device');
const deviceRoutes = require('./routes/devices');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const MQTT_URL = 'mqtt://mqtt:1883';
const REQ_TOPIC = 'deviceList';
const RES_TOPIC = 'deviceList/response';

// --- Mongo ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// --- MQTT ---
const mqttClient = mqtt.connect(MQTT_URL);
mqttClient.on('connect', () => {
  console.log('✅ MQTT connected to', MQTT_URL);
  mqttClient.subscribe(REQ_TOPIC, (err) => {
    if (err) console.error('Failed to subscribe:', err);
    else console.log(`Subscribed to "${REQ_TOPIC}"`);
  });
});

mqttClient.on('error', (err) => {
  console.error('MQTT error:', err);
});

mqttClient.on('message', async (topic, payload) => {
  if (topic !== REQ_TOPIC) return;

  // Optional: payload may include a correlationId or filter; handle if present
  let correlationId;
  try {
    const msg = payload?.length ? JSON.parse(payload.toString()) : {};
    correlationId = msg?.correlationId;
  } catch { /* ignore parse errors */ }

  try {
    const devices = await Device.find().lean();

    // Shape the list exactly for the ESP32:
    const list = devices.map(d => ({
      deviceName: d.deviceName,
      deviceTopic: d.deviceTopic,
      deviceStatusTopic: d.deviceStatusTopic
    }));

    const response = { devices: list };
    if (correlationId) response.correlationId = correlationId;

    mqttClient.publish(RES_TOPIC, JSON.stringify(response), { qos: 1 }, (err) => {
      if (err) console.error('Publish error:', err);
      else console.log(`Published ${list.length} devices to "${RES_TOPIC}"`);
    });
  } catch (e) {
    console.error('Failed to fetch/publish devices:', e);
    const errorResp = { error: 'DB_ERROR', message: e.message || 'Unknown error' };
    if (correlationId) errorResp.correlationId = correlationId;
    mqttClient.publish(RES_TOPIC, JSON.stringify(errorResp), { qos: 1 });
  }
});

// --- REST ---
app.use('/api/devices', deviceRoutes);

app.get('/', (_req, res) => {
  res.send('Device API & MQTT middleman is running');
});

app.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));


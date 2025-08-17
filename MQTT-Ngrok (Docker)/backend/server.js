require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const mqtt = require("mqtt");
const Device = require("./models/Device");

const app = express();
app.use(express.json());

// Load environment variables
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/devices";
const mqttBroker = process.env.MQTT_BROKER || "mqtt://localhost:1883";
const port = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

// MQTT client
const mqttClient = mqtt.connect(mqttBroker);

mqttClient.on("connect", () => {
  console.log("Backend connected to MQTT broker");

  // Subscribe for ESP32 requests
  mqttClient.subscribe("db/device/request");
});

mqttClient.on("message", async (topic, message) => {
  if (topic === "db/device/request") {
    const devices = await Device.find();
    mqttClient.publish("db/device/response/all", JSON.stringify(devices));
  }
});

// REST endpoint (optional)
app.get("/devices", async (req, res) => {
  const devices = await Device.find();
  res.json(devices);
});

app.listen(5000, () => console.log("Backend running on port 5000"));

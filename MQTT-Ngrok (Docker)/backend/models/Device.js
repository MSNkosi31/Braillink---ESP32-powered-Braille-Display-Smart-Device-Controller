const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  device: String,
  subscribeTopic: String,
  publishTopic: String
});

module.exports = mongoose.model("Device", DeviceSchema);

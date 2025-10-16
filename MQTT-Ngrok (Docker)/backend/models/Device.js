const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceName: {
    type: String,
    required: true,
    trim: true
  },
  deviceStatusTopic: {
    type: String,
    required: true,
    trim: true
  },
  deviceTopic: {
    type: String,
    required: true,
    trim: true
  },
  roomName: {
    type: String,
    required: true,
    trim: true
  },
},
{ timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema)

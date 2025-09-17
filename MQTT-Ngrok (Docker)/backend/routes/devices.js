const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// @desc    Get all devices (grouped by room)
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().lean();

    // Group by roomName
    const roomMap = {};
    devices.forEach(d => {
      const room = d.roomName || "Unassigned";
      if (!roomMap[room]) roomMap[room] = [];
      roomMap[room].push({
        _id: d._id,
        deviceName: d.deviceName,
        deviceTopic: d.deviceTopic,
        deviceStatusTopic: d.deviceStatusTopic,
      });
    });

    // Convert map → array
    const rooms = Object.keys(roomMap).map(roomName => ({
      roomName,
      devices: roomMap[roomName],
    }));

    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Add a new device
router.post('/', async (req, res) => {
  const { deviceName, deviceStatusTopic, deviceTopic, roomName } = req.body;

  if (!deviceName || !deviceStatusTopic || !deviceTopic || !roomName) {
    return res.status(400).json({ message: 'All fields are required (deviceName, deviceTopic, deviceStatusTopic, roomName)' });
  }

  try {
    const device = new Device({ deviceName, deviceStatusTopic, deviceTopic, roomName });
    await device.save();
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get devices by room name
router.get('/room/:roomName', async (req, res) => {
  try {
    const roomName = req.params.roomName;
    const devices = await Device.find({ roomName }).lean();

    if (!devices.length) {
      return res.status(404).json({ message: `No devices found in room: ${roomName} `});
    }

    res.json({
      roomName,
      devices: devices.map(d => ({
        _id: d._id,
        deviceName: d.deviceName,
        deviceTopic: d.deviceTopic,
        deviceStatusTopic: d.deviceStatusTopic,
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update a device
router.put('/:id', async (req, res) => {
  const { deviceName, deviceStatusTopic, deviceTopic, roomName } = req.body;

  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { deviceName, deviceStatusTopic, deviceTopic, roomName },
      { new: true }
    );
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a device
router.delete('/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
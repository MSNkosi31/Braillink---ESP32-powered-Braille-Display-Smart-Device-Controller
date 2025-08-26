const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// @desc    Get all devices
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Add a new device
router.post('/', async (req, res) => {
  const { deviceName, deviceStatusTopic, deviceTopic } = req.body;

  if (!deviceName || !deviceStatusTopic || !deviceTopic) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const device = new Device({ deviceName, deviceStatusTopic, deviceTopic });
    await device.save();
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Update a device
router.put('/:id', async (req, res) => {
  const { deviceName, deviceStatusTopic, deviceTopic } = req.body;

  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { deviceName, deviceStatusTopic, deviceTopic },
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

module.exports = router;

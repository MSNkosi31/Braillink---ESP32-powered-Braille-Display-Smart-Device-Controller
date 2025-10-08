const express = require('express');
const router = express.Router();
const Routine = require('../models/Routine');
const mqtt = require('mqtt');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://mqtt:1883';
const mqttClient = mqtt.connect(MQTT_URL);

router.post('/', async (req, res) => {
  try {
    const { name, actions } = req.body;

    if (!name || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: 'name and at least one action are required' });
    }

    const routine = new Routine({ name, actions });
    const savedRoutine = await routine.save();

    res.status(201).json(savedRoutine);
  } catch (err)  {
    console.error('Error creating routine:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const routines = await Routine.find().populate('actions.deviceId');
    res.json(routines);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id).populate('actions.deviceId');
    if (!routine) return res.status(404).json({ error: 'Routine not found' });
    res.json(routine);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { name, actions } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (actions) updateFields.actions = actions;

    const updatedRoutine = await Routine.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedRoutine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    res.json(updatedRoutine);
  } catch (err) {
    console.error('Error updating routine:', err);
    res.status(500).json({ error: err.message });
  }
});


router.post('/execute/:id', async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id).populate('actions.deviceId');
    if (!routine) return res.status(404).json({ error: 'Routine not found' });

    for (const action of routine.actions) {
      const device = action.deviceId;
      if (!device) continue;

      const topic = `${device.roomName}/${device.deviceName}`;
      const message = action.action;

      mqttClient.publish(topic, message, { qos: 0 }, (err) => {
        if (err) console.error(`MQTT publish error to ${topic}:`, err);
      });
    }

    res.json({ message: `Routine "${routine.name}" executed`, actions: routine.actions });
  } catch (err) {
    console.error('Error executing routine:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Routine.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Routine not found' });
    res.json({ message: 'Routine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
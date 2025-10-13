const express = require('express');
const router = express.Router();
const Routine = require('../models/Routine');
const mqtt = require('mqtt');
const { executeRoutine } = require('../services/routineExecutor');
const scheduler = require('../services/scheduler');

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
    const result = await executeRoutine(req.params.id);

    //update lastExecuted timestamp
    await Routine.findByIdAndUpdate(req.params.id, {
      lastExecuted: new Date()
    });

    res.json({
      message: `Routine "${result.routineName}" executed`,
      execution: result
    });
  } catch (err) {
    console.error('Error executing routine:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Routine.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Routine not found' });

    //unschedule if it was scheduled
    scheduler.unscheduleRoutine(req.params.id);

    res.json({ message: 'Routine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//endpoint to toggle scheduling for a routine
router.patch('/:id/schedule', async (req, res) => {
  try {
    const {scheduled, cronExpression, time, daysOfWeek, enabled} = req.body;

    const updateFields = {};

    if (typeof scheduled === 'boolean') {
      updateFields.scheduled = scheduled;
    }

    if (cronExpression !== undefined) {
      updateFields['schedule.cronExpression'] = cronExpression;
    }

    if (time !== undefined) {
      updateFields['schedule.time'] = time;
    }

    if (daysOfWeek !== undefined) {
      updateFields['schedule.daysOfWeek'] = daysOfWeek;
    }

    if (typeof enabled === 'boolean') {
      updateFields['schedule.enabled'] = enabled;
    }

    const updatedRoutine = await Routine.findByIdAndUpdate(
      req.params.id,
      {$set: updateFields},
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedRoutine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    //update scheduler
    scheduler.updateRoutineSchedule(updatedRoutine);

    res.json(updatedRoutine);
  } catch (error) {
    console.error('Error updating routine schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

//get scheduled routines
router.get('/scheduled/active', async (_req, res) => {
  try {
    const scheduledRoutines = await Routine.find({
      'scheduled': true,
      'schedule.enabled': true
    });

    res.json(scheduledRoutines);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
})


module.exports = router;
const Routine = require('../models/Routine');
const mqtt = require('mqtt');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://mqtt:1883';
const mqttClient = mqtt.connect(MQTT_URL);

async function executeRoutine(routineId) {
    try {
        const routine = await Routine.findById(routineId).populate('actions.deviceId');
        if (!routine) {
            throw new Error(`Routine with ID ${routineId} not found`);
        }

        console.log(`Executing routine: ${routine.name}`);
        
        const executionResults = [];

        for (const action of routine.actions) {
            const device = action.deviceId;
            if (!device) {
                executionResults.push({
                    deviceId: action.deviceId,
                    success: false,
                    error: 'Device not found'
                });
                continue;
            }

            const topic = `${device.roomName}/${device.deviceName}`;
            const message = action.action;

            try {
                await new Promise((resolve, reject) => {
                    mqttClient.publish(topic, message, {qos: 0}, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });

                executionResults.push({
                    deviceId: device._id,
                    deviceName: device.deviceName,
                    topic,
                    message,
                    success: true
                });

                console.log(`Published to ${topic}: ${message}`);

                //small delay between actions
                await new Promise(res => setTimeout(res, 200));
                
            } catch (err) {
                console.error(`MQTT publish error to ${topic}:`, err);
                executionResults.push({
                    deviceId: device._id,
                    deviceName: device.deviceName,
                    topic,
                    message,
                    success: false,
                    error: err.message
                });
            }
        }

        return {
            routineId: routine._id,
            routineName: routine.name,
            executedAt: new Date(),
            results: executionResults
        };
    } catch (error) {
        console.error('Error executing routine:', error);
        throw error;
        
    }
}

module.exports = {executeRoutine};
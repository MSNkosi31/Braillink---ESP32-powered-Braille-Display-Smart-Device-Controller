import React, { useState, useEffect } from "react";
import mqtt from 'mqtt';
import Sidebar, { type TabType } from "../common/Sidebar";
import DeviceCard from "../common/DeviceCard";
import SystemLogs from "../common/SystemLogs";
import BrailleDisplay from "../brailleDisplay/BrailleDisplay";
import DevicesManagement from "../devices/DevicesManagement";
import ProfileSettings from "../auth/profile/ProfileSettings";
import Notifications from "~/routes/notifications";
import { Routes } from "react-router-dom";
import RoutesPage from "../routes/RoutesPage";

interface Device {
    id: string;
    name: string;
    type: "light" | "temp" | "door" | "voice";
    status: boolean;
    location: string;
    deviceTopic: string;
    deviceStatusTopic: string;
    battery?: number;
}

interface Log {
    id: number;
    message: string;
    timestamp: Date;
    type: "success" | "error" | "warning" | "info";
}

// Interfaces for API response
interface ApiDevice {
    _id: string;
    deviceName: string;
    deviceTopic: string;
    deviceStatusTopic: string;
}

interface Room {
    roomName: string;
    devices: ApiDevice[];
}

interface ApiResponse {
    rooms: Room[];
}

// Interface for MQTT status response
interface StatusResponse {
    status: "ON" | "OFF" | "on" | "off";
    battery?: number;
    [key: string]: any;
}

const API_BASE = "https://braillink-api.ngrok.app/api";

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [devices, setDevices] = useState<Device[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);
    const [isMqttConnected, setIsMqttConnected] = useState(false);

    // Function to transform API response to expected Device format
    const transformApiDataToDevices = (apiData: ApiResponse): Device[] => {
        const devices: Device[] = [];

        apiData.rooms.forEach(room => {
            room.devices.forEach(apiDevice => {
                const getDeviceType = (name: string): "light" | "temp" | "door" | "voice" => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('light') || lowerName.includes('lamp')) return 'light';
                    if (lowerName.includes('temp') || lowerName.includes('thermo')) return 'temp';
                    if (lowerName.includes('door') || lowerName.includes('lock')) return 'door';
                    if (lowerName.includes('voice') || lowerName.includes('speaker')) return 'voice';
                    return 'light';
                };

                devices.push({
                    id: apiDevice._id,
                    name: apiDevice.deviceName,
                    type: getDeviceType(apiDevice.deviceName),
                    status: false,
                    location: room.roomName,
                    deviceTopic: apiDevice.deviceTopic,
                    deviceStatusTopic: apiDevice.deviceStatusTopic,
                    battery: undefined
                });
            });
        });

        return devices;
    };

    // Initialize MQTT connection and subscribe to status topics
    // Initialize MQTT connection and subscribe to status topics
const initializeMQTT = (devices: Device[]) => {
    const MQTT_BROKER = 'wss://braillink-broker.ngrok.app/mqtt';
    const MQTT_CLIENT_ID = 'braillink-' + Math.random().toString(16).substr(2, 8);

    const connectionOptions: mqtt.IClientOptions = {
        clientId: MQTT_CLIENT_ID,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30000,
        keepalive: 60,
        protocol: 'wss',
        rejectUnauthorized: false
    };

    console.log('🔗 Attempting MQTT connection to:', MQTT_BROKER);
    const client = mqtt.connect(MQTT_BROKER, connectionOptions);

    client.on('connect', () => {
        console.log('✅ MQTT connected successfully');
        setIsMqttConnected(true);

        setLogs(prev => [
            { id: Date.now(), message: 'MQTT connected successfully to broker', timestamp: new Date(), type: 'success' },
            ...prev,
        ]);

        // Subscribe to all "_status" topics
        devices.forEach(device => {
            const statusTopic = `${device.deviceTopic}_status`;
            client.subscribe(statusTopic, err => {
                if (err) {
                    console.error(`❌ Failed to subscribe to ${statusTopic}:`, err);
                    setLogs(prev => [
                        { id: Date.now(), message: `Failed to subscribe to ${statusTopic}`, timestamp: new Date(), type: 'error' },
                        ...prev,
                    ]);
                } else {
                    console.log(`✅ Subscribed to ${statusTopic}`);
                    // Update each device object with its status topic
                    setDevices(prev =>
                        prev.map(d =>
                            d.id === device.id
                                ? { ...d, deviceStatusTopic: statusTopic }
                                : d
                        )
                    );
                }
            });
        });
    });

    // Handle status updates
    client.on('message', (topic, message) => {
        const msg = message.toString().trim().toUpperCase();
        const isOn = msg === 'ON';
        const isOff = msg === 'OFF';

        if (isOn || isOff) {
            setDevices(prevDevices => {
                const updated = prevDevices.map(device =>
                    topic === `${device.deviceTopic}_status`
                        ? { ...device, status: isOn }
                        : device
                );

                const updatedDevice = updated.find(d => topic === `${d.deviceTopic}_status`);
                if (updatedDevice) {
                    const newLog: Log = {
                        id: Date.now(),
                        message: `${updatedDevice.name} is now ${isOn ? 'ON' : 'OFF'}`,
                        timestamp: new Date(),
                        type: 'info'
                    };
                    setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 49)]);
                }

                return updated;
            });
        } else {
            console.log('ℹ️ Unknown MQTT message:', topic, msg);
        }
    });

    client.on('error', err => {
        console.error('❌ MQTT error:', err);
        setIsMqttConnected(false);
        setLogs(prev => [
            { id: Date.now(), message: `MQTT connection error: ${err.message}`, timestamp: new Date(), type: 'error' },
            ...prev,
        ]);
    });

    client.on('close', () => {
        console.log('🔌 MQTT connection closed');
        setIsMqttConnected(false);
    });

    client.on('offline', () => {
        console.log('📴 MQTT offline');
        setIsMqttConnected(false);
    });

    client.on('reconnect', () => {
        console.log('🔄 MQTT attempting to reconnect...');
    });

    setMqttClient(client);
};


    // Function to manually check device status
    const checkDeviceStatus = (deviceId: string) => {
        const device = devices.find(d => d.id === deviceId);
        if (device && mqttClient && isMqttConnected) {
            mqttClient.publish(device.deviceTopic, 'check');
            console.log('📤 Sent check command to:', device.deviceTopic);

            const newLog: Log = {
                id: Date.now(),
                message: `Requested status update for ${device.name}`,
                timestamp: new Date(),
                type: "info"
            };
            setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 49)]);
        } else {
            console.log('❌ MQTT not connected, cannot check status');
        }
    };

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${API_BASE}/devices`);
            if (res.ok) {
                const apiData: ApiResponse = await res.json();
                const transformedDevices = transformApiDataToDevices(apiData);
                setDevices(transformedDevices);
                initializeMQTT(transformedDevices);

                const successLog: Log = {
                    id: Date.now(),
                    message: `Loaded ${transformedDevices.length} devices`,
                    timestamp: new Date(),
                    type: "success"
                };
                setLogs(prevLogs => [successLog, ...prevLogs]);
            } else {
                throw new Error("Failed to fetch devices");
            }
        } catch (e) {
            console.error(e);
            const errorLog: Log = {
                id: Date.now(),
                message: "Failed to fetch devices from API",
                timestamp: new Date(),
                type: "error"
            };
            setLogs(prevLogs => [errorLog, ...prevLogs]);
        }
    };

    const initLogs = () => {
        setLogs([
            {
                id: Date.now(),
                message: "System initialized successfully",
                timestamp: new Date(),
                type: "success"
            }
        ]);
    };

    useEffect(() => {
        fetchDevices();
        initLogs();

        // Cleanup function
        return () => {
            if (mqttClient) {
                console.log('🧹 Cleaning up MQTT connection');
                mqttClient.end();
            }
        };
    }, []);

    const toggleDevice = async (deviceId: string) => {
        const targetDevice = devices.find(d => d.id === deviceId);
        if (!targetDevice) return;

        const newStatus = !targetDevice.status;
        const command = newStatus ? 'ON' : 'OFF';

        try {
            if (mqttClient && isMqttConnected) {
                // Send the command
                mqttClient.publish(targetDevice.deviceTopic, command);
                console.log('📤 Sent command to:', targetDevice.deviceTopic, command);

                // OPTIMISTIC UPDATE: Immediately update the UI while waiting for MQTT confirmation
                setDevices(prevDevices =>
                    prevDevices.map(device =>
                        device.id === deviceId
                            ? { ...device, status: newStatus }
                            : device
                    )
                );

                const newLog: Log = {
                    id: Date.now(),
                    message: `Sent ${command} command to ${targetDevice.name}`,
                    timestamp: new Date(),
                    type: "info"
                };
                setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 49)]);

                // Request status update to confirm (with delay to let the device process)
                setTimeout(() => {
                    if (mqttClient && isMqttConnected) {
                        mqttClient.publish(targetDevice.deviceTopic, 'check');
                        console.log('🔍 Sent status check to:', targetDevice.deviceTopic);
                    }
                }, 2000);
            } else {
                throw new Error("MQTT not connected");
            }
        } catch (e) {
            console.error(e);
            const errorLog: Log = {
                id: Date.now(),
                message: `Failed to control ${targetDevice.name}`,
                timestamp: new Date(),
                type: "error"
            };
            setLogs(prevLogs => [errorLog, ...prevLogs]);
        }
    };

    // Refresh all device statuses
    const refreshAllStatuses = () => {
        if (mqttClient && isMqttConnected) {
            devices.forEach(device => {
                mqttClient.publish(device.deviceTopic, 'check');
            });

            const newLog: Log = {
                id: Date.now(),
                message: "Refreshing status for all devices",
                timestamp: new Date(),
                type: "info"
            };
            setLogs(prevLogs => [newLog, ...prevLogs]);
        } else {
            console.log('❌ MQTT not connected, cannot refresh statuses');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main className="flex-1 p-6">
                {activeTab === "dashboard" && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold">Device Dashboard</h1>
                                <span className={`text-sm ${isMqttConnected ? 'text-green-600' : 'text-red-600'}`}>
                                    {isMqttConnected ? '✅ MQTT Connected' : '❌ MQTT Disconnected'}
                                </span>
                            </div>
                            <button
                                onClick={refreshAllStatuses}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={!isMqttConnected}
                            >
                                Refresh Status
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {devices.map(device => (
                                <DeviceCard
                                    key={device.id}
                                    device={device}
                                    onToggle={toggleDevice}
                                    onStatusCheck={() => checkDeviceStatus(device.id)}
                                    battery={device.battery}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BrailleDisplay devices={devices} />
                            <SystemLogs logs={logs} />
                        </div>
                    </>
                )}

                {activeTab === "devices" && <DevicesManagement devices={devices} setDevices={setDevices} />}
                {activeTab === "braille" && <BrailleDisplay devices={devices} />}
                {activeTab === "notifications" && <Notifications />}
                {activeTab === "routes" && <RoutesPage />}
                {activeTab === "profile" && <ProfileSettings />}
            </main>
        </div>
    );
};

export default Dashboard;
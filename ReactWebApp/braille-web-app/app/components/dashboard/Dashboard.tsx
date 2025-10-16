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
        console.log('📋 Client ID:', MQTT_CLIENT_ID);

        const client = mqtt.connect(MQTT_BROKER, connectionOptions);

        client.on('connect', () => {
            console.log('✅ MQTT connected successfully');
            setIsMqttConnected(true);

            const successLog: Log = {
                id: Date.now(),
                message: "MQTT connected successfully to broker",
                timestamp: new Date(),
                type: "success"
            };
            setLogs(prevLogs => [successLog, ...prevLogs]);

            // Subscribe to all device status topics
            devices.forEach(device => {
                client.subscribe(device.deviceStatusTopic, (err) => {
                    if (err) {
                        console.error(`❌ Failed to subscribe to ${device.deviceStatusTopic}:`, err);
                        const errorLog: Log = {
                            id: Date.now(),
                            message: `Failed to subscribe to ${device.deviceStatusTopic}`,
                            timestamp: new Date(),
                            type: "error"
                        };
                        setLogs(prevLogs => [errorLog, ...prevLogs]);
                    } else {
                        console.log(`✅ Subscribed to ${device.deviceStatusTopic}`);
                        // Request initial status for this device
                        setTimeout(() => {
                            client.publish(device.deviceTopic, 'check');
                            console.log(`📤 Sent check command to ${device.deviceTopic}`);
                        }, 500);
                    }
                });
            });
        });

        client.on('message', (topic, message) => {
            try {
                console.log('📨 MQTT message received:', topic, message.toString());
                const statusResponse: StatusResponse = JSON.parse(message.toString());
                const isOn = statusResponse.status === 'ON' || statusResponse.status === 'on';
                const battery = statusResponse.battery;

                // Update device status and battery
                setDevices(prevDevices =>
                    prevDevices.map(device =>
                        device.deviceStatusTopic === topic
                            ? {
                                ...device,
                                status: isOn,
                                battery: battery
                            }
                            : device
                    )
                );

                // Add to logs
                const device = devices.find(d => d.deviceStatusTopic === topic);
                if (device) {
                    const batteryText = battery !== undefined ? `, Battery: ${battery}%` : '';
                    const newLog: Log = {
                        id: Date.now(),
                        message: `${device.name} status: ${isOn ? 'ON' : 'OFF'}${batteryText}`,
                        timestamp: new Date(),
                        type: "info"
                    };
                    setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 49)]);
                }
            } catch (error) {
                console.error('❌ Failed to parse status message:', error, 'Message:', message.toString());
            }
        });

        client.on('error', (error) => {
            console.error('❌ MQTT error:', error);
            setIsMqttConnected(false);
            const errorLog: Log = {
                id: Date.now(),
                message: `MQTT connection error: ${error.message}`,
                timestamp: new Date(),
                type: "error"
            };
            setLogs(prevLogs => [errorLog, ...prevLogs]);
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
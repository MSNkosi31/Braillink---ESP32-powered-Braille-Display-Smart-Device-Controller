import React, { useState, useEffect } from "react";
import Sidebar, { type TabType } from "../common/Sidebar";
import DeviceCard from "../common/DeviceCard";
import SystemLogs from "../common/SystemLogs";
import BrailleDisplay from "../brailleDisplay/BrailleDisplay";
import DevicesManagement from "../devices/DevicesManagement";
import ProfileSettings from "../auth/profile/ProfileSettings";
import Notifications from "~/routes/notifications";

interface Device {
    id: number;
    name: string;
    type: "light" | "temp" | "door" | "voice";
    status: boolean;
    location: string;
}

interface Log {
    id: number;
    message: string;
    timestamp: Date;
    type: "success" | "error" | "warning" | "info";
}

//New interfaces for the actual API response
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

const API_BASE = "https://braillink-api.ngrok.app/api";

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [devices, setDevices] = useState<Device[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);

    //Function to transform API response to expected Device format
    const transformApiDataToDevices = (apiData: ApiResponse): Device[] => {
        const devices: Device[] = [];

        apiData.rooms.forEach(room => {
            room.devices.forEach(apiDevice => {
                devices.push({
                    id: parseInt(apiDevice._id) || Date.now() + Math.random(), // Use timestamp + random as fallback
                    name: apiDevice.deviceName,
                    type: "light", // need to determine this from your data
                    status: false, // need to fetch actual status
                    location: room.roomName
                });
            });
        });

        return devices;
    };

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${API_BASE}/devices`);
            if (res.ok) {
                const apiData: ApiResponse = await res.json();
                const transformedDevices = transformApiDataToDevices(apiData);
                setDevices(transformedDevices);
            } else {
                throw new Error("Failed to fetch devices");
            }
        } catch (e) {
            console.error(e);
            // Optionally add a log or toast here
        }
    };

    // Assuming no API for logs, initialize with some or keep empty. If there's a logs endpoint, add fetchLogs similar to fetchDevices.
    const initLogs = () => {
        setLogs([
            {
                id: 1,
                message: "System initialized successfully",
                timestamp: new Date(),
                type: "success"
            }
        ]);
    };

    useEffect(() => {
        fetchDevices();
        initLogs(); // Or fetch if endpoint exists
    }, []);

    const toggleDevice = async (deviceId: number) => {
        const targetDevice = devices.find(d => d.id === deviceId);
        if (!targetDevice) return;

        const newStatus = !targetDevice.status;

        try {
            const res = await fetch(`${API_BASE}/devices/${deviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setDevices(devices.map(device => device.id === deviceId ? {
                    ...device,
                    status: newStatus
                } : device));

                const newLog: Log = {
                    id: logs.length + 1,
                    message: `${targetDevice.name} turned ${newStatus ? "ON" : "OFF"}`,
                    timestamp: new Date(),
                    type: "info"
                };
                setLogs([newLog, ...logs]);
            } else {
                throw new Error("Failed to update device status");
            }
        } catch (e) {
            console.error(e);
            // Optionally add error log or toast
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {devices.map(device => (
                                <DeviceCard
                                    key={device.id}
                                    device={device}
                                    onToggle={toggleDevice}
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
                {activeTab === "profile" && <ProfileSettings />}
            </main>
        </div>
    );
};

export default Dashboard;
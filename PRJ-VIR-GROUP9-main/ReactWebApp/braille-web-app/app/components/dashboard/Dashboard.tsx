import React, {useState} from "react";
import Sidebar, {type TabType} from "../common/Sidebar";
import DeviceCard from "../common/DeviceCard";
import SystemLogs from "../common/SystemLogs";
import BrailleDisplay from "../brailleDisplay/BrailleDisplay";

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

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [devices, setDevices] = useState<Device[]>([
        { 
            id: 1, 
            name: "Living Room Light", 
            type: "light", 
            status: true, 
            location: "Living Room" 
        },
        { 
            id: 2, 
            name: "Thermostat", 
            type: "temp", 
            status: false, 
            location: "Hallway" 
        },
        { 
            id: 3, 
            name: "Front Door", 
            type: "door", 
            status: false, 
            location: "Entrance" 
        },
        { 
            id: 4, 
            name: "Voice Assistant", 
            type: "voice", 
            status: true, 
            location: "Living Room" 
        }
    ]);

    const [logs, setLogs] = useState<Log[]>([
        {
            id: 1,
            message: "System initialized successfully",
            timestamp: new Date(),
            type: "success"
        },
        {
            id: 2,
            message: "Living Room Light turned ON",
            timestamp: new Date(),
            type: "info"
        }
    ]);

    const toggleDevice = (deviceId: number) => {
        setDevices(devices.map(device => device.id === deviceId ? {
            ...device,
            status: !device.status
        } : device));

        const device = devices.find(d => d.id === deviceId);
        if (device) {
            const newLog: Log = {
                id: logs.length + 1,
                message: `${device.name} turned ${device.status ? "OFF" : "ON"}`,
                timestamp: new Date(),
                type: "info"
            };
            setLogs([newLog, ...logs]);
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
                            <BrailleDisplay devices={devices}/>
                            <SystemLogs logs={logs}/>
                        </div>
                    </>
                )}

                {activeTab === "devices" && <div>Devices Mangement</div>}
                {activeTab === "braille" && <div>Braille Display Settings</div>}
                {activeTab === "notifications" && <div>Notification Center</div>}
                {activeTab === "profile" && <div>Profile Settings</div>}
            </main>
        </div>
    );
};




export default Dashboard;
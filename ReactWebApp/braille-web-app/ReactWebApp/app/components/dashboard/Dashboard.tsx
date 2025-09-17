
import React, { useState, useEffect } from 'react';
import Sidebar, { type TabType } from '../common/Sidebar';
import DeviceCard from '../common/DeviceCard';
import SystemLogs from '../common/SystemLogs';
import BrailleDisplay from '../brailleDisplay/BrailleDisplay';
import DevicesManagement from '../devices/DevicesManagement';
import ProfileSettings from '../auth/profile/ProfileSettings';
import Notifications from '~/routes/notifications';
import { getDevices, getLogs, toggleDevice as apiToggleDevice } from '~/services/api';
import useMqtt from '~/hooks/useMqtt';

interface Device {
    id: number;
    name: string;
    type: 'light' | 'temp' | 'door' | 'voice';
    status: boolean;
    location: string;
}

interface Log {
    id: number;
    message: string;
    timestamp: Date;
    type: 'success' | 'error' | 'warning' | 'info';
}

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [devices, setDevices] = useState<Device[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const { publish } = useMqtt();

    useEffect(() => {
        const fetchDevicesAndLogs = async () => {
            try {
                const devicesData = await getDevices();
                setDevices(devicesData);
                const logsData = await getLogs();
                setLogs(logsData);
            } catch (error) {
                console.error(error);
            }
        };
        fetchDevicesAndLogs();
    }, []);

    const toggleDevice = async (deviceId: number) => {
        const device = devices.find(d => d.id === deviceId);
        if (device) {
            try {
                const updatedDevice = await apiToggleDevice(deviceId, device.status);
                setDevices(devices.map(d => d.id === deviceId ? updatedDevice : d));
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main className="flex-1 p-6">
                {activeTab === 'dashboard' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {devices.map(device => (
                                <DeviceCard
                                    key={device.id}
                                    device={device}
                                    onToggle={toggleDevice}
                                    publish={publish}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BrailleDisplay devices={devices} />
                            <SystemLogs logs={logs} />
                        </div>
                    </>
                )}

                {activeTab === 'devices' && <DevicesManagement devices={devices} setDevices={setDevices} />}
                {activeTab === 'braille' && <BrailleDisplay devices={devices} />}
                {activeTab === 'notifications' && <Notifications />}
                {activeTab === 'profile' && <ProfileSettings />}
            </main>
        </div>
    );
};

export default Dashboard;

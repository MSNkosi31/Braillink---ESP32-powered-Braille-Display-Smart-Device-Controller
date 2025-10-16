import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import DeviceCard from "../common/DeviceCard";
import AddDeviceModal from "./AddDeviceModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
// import { useToast } from "~/contexts/ToastContext";

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

interface DevicesManagementProps {
    devices: Device[];
    setDevices: (devices: Device[]) => void;
}

const API_BASE = "https://braillink-api.ngrok.app/api";

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

const DevicesManagement: React.FC<DevicesManagementProps> = ({
    devices = [],
    setDevices
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
    // const { showToast } = useToast();
    const showToast = (message: string, type: string) => {
        console.log(`${type.toUpperCase()}: ${message}`);
    };

    // Function to transform API response to expected Device format
    const transformApiDataToDevices = (apiData: ApiResponse): Device[] => {
        const devices: Device[] = [];

        apiData.rooms.forEach(room => {
            room.devices.forEach(apiDevice => {
                // Determine device type based on name
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
            showToast("Error fetching devices", "error");
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleAddDevice = async (deviceData: Omit<Device, "id">) => {
        try {
            // Send as JSON in the request body instead of URL parameters
            const apiDeviceData = {
                deviceName: deviceData.name,
                deviceTopic: deviceData.deviceTopic,
                deviceStatusTopic: deviceData.deviceStatusTopic,
                roomName: deviceData.location
            };

            const res = await fetch(`${API_BASE}/devices`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(apiDeviceData)
            });

            if (res.ok) {
                await fetchDevices(); // Refetch to sync with server
                setShowAddModal(false);
                showToast(`Device "${deviceData.name}" added successfully`, "success");
            } else {
                const errorText = await res.text();
                throw new Error(`Failed to add device: ${errorText}`);
            }
        } catch (e) {
            console.error(e);
            showToast("Error adding device", "error");
        }
    };

    const handleDeleteDevice = async () => {
        if (!deviceToDelete) return;
        try {
            // Updated to match the correct API endpoint format from documentation
            const res = await fetch(`${API_BASE}/devices/${deviceToDelete.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchDevices(); // Refetch to sync with server
                showToast(`Device "${deviceToDelete.name}" deleted`, "error");
                setDeviceToDelete(null);
            } else {
                throw new Error("Failed to delete device");
            }
        } catch (e) {
            console.error(e);
            showToast("Error deleting device", "error");
        }
    };

    // Since we're using MQTT for status updates, this will be handled by the parent component
    const handleToggleDevice = async (deviceId: string) => {
        // This will be handled by MQTT in the parent component
        console.log(`Toggle device ${deviceId} - handled by MQTT`);
    };

    // Since we're using MQTT for status checks, this will be handled by the parent component
    const handleStatusCheck = (deviceId: string) => {
        // This will be handled by MQTT in the parent component
        console.log(`Check status for device ${deviceId} - handled by MQTT`);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Devices Management</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FaPlus />
                    <span>Add Device</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {devices.map(device => (
                    <div key={device.id} className="relative group">
                        <DeviceCard
                            device={device}
                            onToggle={handleToggleDevice}
                            onStatusCheck={() => handleStatusCheck(device.id)}
                            battery={device.battery}
                        />
                        <button
                            onClick={() => setDeviceToDelete(device)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                            title="Delete device"
                            aria-label={`Delete ${device.name}`}
                        >
                            <FaTrash className="text-xs" />
                        </button>
                    </div>
                ))}
            </div>

            {devices.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No devices found. Add your first device!</p>
                </div>
            )}

            <AddDeviceModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAddDevice={handleAddDevice}
            />

            <DeleteConfirmationModal
                isOpen={!!deviceToDelete}
                onClose={() => setDeviceToDelete(null)}
                onConfirm={handleDeleteDevice}
                deviceName={deviceToDelete?.name || ""}
            />
        </div>
    );
};

export default DevicesManagement;
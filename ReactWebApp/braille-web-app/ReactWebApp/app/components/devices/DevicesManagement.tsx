import React, { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import DeviceCard from "../common/DeviceCard";
import AddDeviceModal from "./AddDeviceModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useToast } from "~/contexts/ToastContext";

interface Device {
    id: number;
    name: string;
    type: "light" | "temp" | "door" | "voice";
    status: boolean;
    location: string;
}

interface DevicesManagementProps {
    devices: Device[];
    setDevices: (devices: Device[]) => void;
}

const DevicesManagement: React.FC<DevicesManagementProps> = ({ devices, setDevices }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
    const { showToast } = useToast();

    const handleAddDevice = (deviceData: Omit<Device, "id">) => {
        const newDevice: Device = {
            ...deviceData,
            id: devices.length > 0 ? Math.max(...devices.map(d => d.id)) + 1 : 1
        };
        setDevices([...devices, newDevice]);
        setShowAddModal(false);
        showToast(`Device "${newDevice.name}" added successfully`, "success");
    };

    const handleDeleteDevice = () => {
        if (!deviceToDelete) return;
        setDevices(devices.filter(device => device.id !== deviceToDelete.id));
        showToast(`Device "${deviceToDelete.name}" deleted`, "error");
        setDeviceToDelete(null);
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
                            onToggle={(id) => {
                                setDevices(devices.map(d => 
                                    d.id === id ? {...d, status: !d.status} : d
                                ));
                            }}
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
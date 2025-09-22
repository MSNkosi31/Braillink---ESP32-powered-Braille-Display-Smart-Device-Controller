import React from "react";
import Modal from "../common/Modal";

interface DeviceForm {
    name: string;
    type: "light" | "temp" | "door" | "voice";
    status: boolean;
    location: string;
}

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddDevice: (device: Omit<DeviceForm, "id">) => void;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose, onAddDevice }) => {
    const [newDevice, setNewDevice] = React.useState<DeviceForm>({
        name: "",
        type: "light",
        status: false,
        location: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddDevice(newDevice);
        setNewDevice({
            name: "",
            type: "light",
            status: false,
            location: ""
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Device">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Device Name
                    </label>
                    <input
                        type="text"
                        value={newDevice.name}
                        onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g. Kitchen Light"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        value={newDevice.location}
                        onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g. Kitchen"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Device Type
                    </label>
                    <select
                        value={newDevice.type}
                        onChange={(e) => setNewDevice({...newDevice, type: e.target.value as DeviceForm["type"]})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                    >
                        <option value="light">Light</option>
                        <option value="temp">Thermostat</option>
                        <option value="door">Door</option>
                        <option value="voice">Voice Assistant</option>
                    </select>
                </div>
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Initial Status
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={newDevice.status}
                            onChange={(e) => setNewDevice({...newDevice, status: e.target.checked})}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        disabled={!newDevice.name || !newDevice.location}
                    >
                        Add Device
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDeviceModal;
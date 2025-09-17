import React from "react";
import { FaLightbulb, FaThermometerHalf, FaDoorOpen, FaVolumeUp } from "react-icons/fa";

interface DeviceCardProps {
    device: {
        id: number;
        name: string;
        type: "light" | "temp" | "door" | "voice";
        status: boolean;
        location: string;
    };
    onToggle: (id: number) => void;
    publish: (topic: string, message: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
    device,
    onToggle,
    publish
}) => {
    const getIcon = () => {
        switch (device.type) {
            case "light": return <FaLightbulb className="text-yellow-500"/>;
            case "temp": return <FaThermometerHalf className="text-red-500"/>;
            case "door": return <FaDoorOpen className="text-blue-500"/>;
            case "voice": return <FaVolumeUp className="text-green-500"/>;
            default: return <FaLightbulb className="text-gray-500"/>;
        }
    };

    const handleSend = () => {
        publish("braille/test", "Hello");
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm transition-all ${
            device.status ? "border-l-4 border-green-500" : "border-l-4 border-gray-300 dark:border-gray-600"
        } hover:shadow-md`}>
            <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 rounded-full bg-blue-50 dark:bg-gray-700">
                    {getIcon()}
                </div>
                <div>
                    <h3 className="font-medium">
                        {device.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {device.location}
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    device.status ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                    {device.status ? "ON" : "OFF"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={device.status}
                        onChange={() => onToggle(device.id)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
            </div>
            <button
                onClick={handleSend}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
            >
                Send
            </button>
        </div>
    );
};
export default DeviceCard;
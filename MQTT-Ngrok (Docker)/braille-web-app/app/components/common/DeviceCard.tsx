import React from "react";
import { FaLightbulb, FaThermometerHalf, FaDoorOpen, FaVolumeUp, FaBatteryHalf, FaSync } from "react-icons/fa";

interface DeviceCardProps {
    device: {
        id: string;
        name: string;
        type: "light" | "temp" | "door" | "voice";
        status: boolean;
        location: string;
        battery?: number;
    };
    onToggle: (id: string) => void;
    onStatusCheck?: () => void;
    battery?: number;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
    device,
    onToggle,
    onStatusCheck
}) => {
    const getIcon = () => {
        switch (device.type) {
            case "light": return <FaLightbulb className="text-yellow-500" />;
            case "temp": return <FaThermometerHalf className="text-red-500" />;
            case "door": return <FaDoorOpen className="text-blue-500" />;
            case "voice": return <FaVolumeUp className="text-green-500" />;
            default: return <FaLightbulb className="text-gray-500" />;
        }
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm transition-all ${device.status ? "border-l-4 border-green-500" : "border-l-4 border-gray-300 dark:border-gray-600"
            } hover:shadow-md`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
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
                {onStatusCheck && (
                    <button
                        onClick={onStatusCheck}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Check status"
                    >
                        <FaSync className="text-sm" />
                    </button>
                )}
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${device.status ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                        {device.status ? "ON" : "OFF"}
                    </span>
                    {device.battery !== undefined && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <FaBatteryHalf />
                            <span>{device.battery}%</span>
                        </div>
                    )}
                </div>
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
        </div>
    );
};
export default DeviceCard;
import React from "react";
import { FaTrash } from "react-icons/fa";

interface SystemLogsProps {
    logs: {
        id: number;
        message: string;
        timestamp: Date;
        type: "success" | "error" | "warning" | "info";
    }[];
}

const SystemLogs: React.FC<SystemLogsProps> = ({
    logs
}) => {
    const getLogColor = (type: string) => {
        switch (type) {
            case "success": return "text-green-600 dark:text-green-400";
            case "error": return "text-red-600 dark:text-red-400";
            case "warning": return "text-yellow-600 dark:text-yellow-400";
            default: return "text-blue-600 dark:text-blue-400";
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium flex items-center space-x-2">
                    <span className="text-blue-500">
                        System Logs
                    </span>
                </h3>
                <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <FaTrash/>
                </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map(log => (
                    <div key={log.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                        <p className={`text-sm ${getLogColor(log.type)}`}>
                            {log.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-400">
                            {log.timestamp.toLocaleTimeString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SystemLogs;
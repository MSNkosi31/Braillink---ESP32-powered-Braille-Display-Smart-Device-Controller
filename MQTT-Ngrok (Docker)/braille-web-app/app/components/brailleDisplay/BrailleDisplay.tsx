import React, { useState, useEffect } from "react";

interface BrailleDisplayProps {
    devices: {
        id: string;
        name: string;
        type: "light" | "temp" | "door" | "voice";
        status: boolean;
        location: string;
        battery?: number;
    }[];
}

const BrailleDisplay: React.FC<BrailleDisplayProps> = ({
    devices
}) => {
    const [dots, setDots] = useState<boolean[]>([false, false, false, false, false, false]);

    const brailleMap: Record<string, boolean[]> = {
        light_on: [true, false, false, true, false, false],
        light_off: [false, false, false, false, false, false],
        door_locked: [true, false, true, false, true, false],
        door_unlocked: [true, true, false, false, false, false],
        temp_on: [true, true, true, true, false, false],
        temp_off: [false, false, false, false, false, false],
        voice_on: [false, true, true, true, false, false],
        voice_off: [false, false, false, false, false, false]
    };

    useEffect(() => {
        // Update braille display based on device statuses
        const lightDevice = devices.find(d => d.type === "light");
        const doorDevice = devices.find(d => d.type === "door");
        const tempDevice = devices.find(d => d.type === "temp");
        const voiceDevice = devices.find(d => d.type === "voice");

        if (lightDevice) {
            const newDots = lightDevice.status ? brailleMap.light_on : brailleMap.light_off;
            setDots(newDots);
        } else if (doorDevice) {
            const newDots = doorDevice.status ? brailleMap.door_locked : brailleMap.door_unlocked;
            setDots(newDots);
        } else if (tempDevice) {
            const newDots = tempDevice.status ? brailleMap.temp_on : brailleMap.temp_off;
            setDots(newDots);
        } else if (voiceDevice) {
            const newDots = voiceDevice.status ? brailleMap.voice_on : brailleMap.voice_off;
            setDots(newDots);
        }
    }, [devices]);

    const toggleDot = (index: number) => {
        const newDots = [...dots];
        newDots[index] = !newDots[index];
        setDots(newDots);
    };

    const getCurrentStatusText = () => {
        const lightDevice = devices.find(d => d.type === "light");
        const doorDevice = devices.find(d => d.type === "door");
        const tempDevice = devices.find(d => d.type === "temp");
        const voiceDevice = devices.find(d => d.type === "voice");

        if (lightDevice) return `Light: ${lightDevice.status ? "ON" : "OFF"}`;
        if (doorDevice) return `Door: ${doorDevice.status ? "LOCKED" : "UNLOCKED"}`;
        if (tempDevice) return `Temp: ${tempDevice.status ? "ON" : "OFF"}`;
        if (voiceDevice) return `Voice: ${voiceDevice.status ? "ON" : "OFF"}`;
        return "No active devices";
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-blue-500">
                    Braille Display
                </h3>
                <button
                    onClick={() => setDots([false, false, false, false, false, false])}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    Reset
                </button>
            </div>

            <div className="flex flex-col items-center">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {dots.map((active, index) => (
                        <button
                            key={index}
                            onClick={() => toggleDot(index)}
                            className={`w-10 h-10 rounded-full transition-all ${active ? "bg-blue-600 shadow-lg shadow-blue-500/50" : "bg-gray-200 dark:bg-gray-600"
                                }`}
                            aria-label={`Braille dot ${index + 1}`}
                        />
                    ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {getCurrentStatusText()}
                    <br />
                    <span className="text-xs">Displaying first available device status</span>
                </div>
            </div>
        </div>
    );
};

export default BrailleDisplay;
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

};

export default BrailleDisplay;
import React, {useState, useEffect} from "react";

interface BrailleDisplayProps {
    devices: {
        id: number;
        name: string;
        type: "light" | "temp" | "door" | "voice";
        status: boolean;
        location: string;
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
        temp_off: [false, false, false, false, false, false]
    };

    useEffect(() => {
        const lightDevice = devices.find(d => d.type === "light");
        if (lightDevice) {
            const newDots = lightDevice.status ? brailleMap.light_on : brailleMap.light_off;
            setDots(newDots);
        }
    }, [devices]);

    const toggleDot = (index: number) => {
        const newDots = [...dots];
        newDots[index] = !newDots[index];
        setDots(newDots);
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
                            className={`w-10 h-10 rounded-full transition-all ${
                                active ? "bg-blue-600 shadow-lg shadow-blue-500/50" : "bg-gray-200 dark:bg-gray-600"
                            }`}
                            aria-label={`Braille dot ${index + 1}`}
                        />
                    ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Current: {devices.find(d => d.type === "light")?.status ? "Light ON" : "Light OFF"}
                </div>
            </div>
        </div>
    );
};

export default BrailleDisplay;
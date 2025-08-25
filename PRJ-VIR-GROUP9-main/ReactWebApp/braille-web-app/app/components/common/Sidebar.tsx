import React from "react";
import { FaTachometerAlt, FaLightbulb, FaBraille, FaBell, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export type TabType = "dashboard" | "devices" | "braille" | "notifications" | "profile";

interface SidebarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab
}) => {
    const navigate = useNavigate();
    const handleLogout = () => {
        //add logic to clear tokens from local storage here

        navigate("/")
    }

    return (
        <aside className="w-64 bg-gray-800 dark:bg-gray-900 text-white p-4 flex flex-col h-screen sticky top-0">
            <div className="mb-8 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-blue-400">
                    Smart Braille
                </h2>
            </div>
            <nav className="flex-1">
                <ul className="space-y-2">
                    {[
                        {id: "dashboard" as TabType, icon: <FaTachometerAlt/>, label: "Dashboard"},
                        {id: "devices" as TabType, icon: <FaLightbulb/>, label: "Devices"},
                        {id: "braille" as TabType, icon: <FaBraille/>, label: "Braille Display"},
                        {id: "notifications" as TabType, icon: <FaBell/>, label: "Notifications"},
                        {id: "profile" as TabType, icon: <FaUser/>, label: "Profile"}
                    ].map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                                    activeTab === item.id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
                                }`}
                            >
                                <span className="text-lg">{item.icon} </span>
                                <span>{item.label} </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="pt-4 border-t border-gray-700">
                <button
                    onClick={handleLogout} 
                    className="flex items-center space-x-3 text-gray-300 hover:text-white px-4 py-3 w-full cursor-pointer"
                >
                    <FaSignOutAlt/>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
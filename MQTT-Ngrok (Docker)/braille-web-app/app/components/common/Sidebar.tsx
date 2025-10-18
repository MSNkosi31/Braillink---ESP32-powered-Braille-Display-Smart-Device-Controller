import React from "react";
import { FaTachometerAlt, FaLightbulb, FaBraille, FaBell, FaUser, FaRoute, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "~/contexts/AuthContext";


export type TabType = "dashboard" | "devices" | "braille" | "notifications" | "routine" |"profile";

interface SidebarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab
}) => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    
    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
        } catch (error) {
            console.error('Logout failed:', error);
            // Still navigate to signin page even if logout fails
            navigate("/");
        }
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
                        { id: "routes" as TabType, icon: <FaRoute />, label: "Routines" },
                        {id: "profile" as TabType, icon: <FaUser/>, label: "Profile"},
                    ].map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                                    activeTab === item.id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
                                }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            
            {/* User Information */}
            {currentUser && (
                <div className="pt-4 border-t border-gray-700 mb-4">
                    <div className="px-4 py-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                <FaUser className="text-white text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {currentUser.displayName || 'User'}
                                </p>
                                <p className="text-xs text-gray-300 truncate">
                                    {currentUser.email}
                                </p>
                                <p className="text-xs text-indigo-400 capitalize">
                                    {currentUser.role}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="pt-4 border-t border-gray-700">
                <button
                    onClick={handleLogout} 
                    className="flex items-center space-x-3 text-gray-300 hover:text-white px-4 py-3 w-full cursor-pointer rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <FaSignOutAlt />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

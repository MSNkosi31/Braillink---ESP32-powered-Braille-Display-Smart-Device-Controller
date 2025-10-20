import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";

// Type definition for one notification
type Notification = {
  id: number;
  message: string;
  time: string;
  type: "System" | "User";
  read: boolean;
};

// Default data
const defaultNotifications: Notification[] = [
  { id: 1, message: "New braille device connected.", time: "Just now", type: "System", read: false },
  { id: 2, message: "Profile updated successfully.", time: "10 mins ago", type: "User", read: false },
  { id: 3, message: "New firmware available.", time: "1 hour ago", type: "System", read: false },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : defaultNotifications;
  });

  const [filter, setFilter] = useState<"All" | "User" | "System">("All");
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const handleDismiss = (id: number) => {
    setDismissed((prev: any) => [...prev, id]);
    setTimeout(() => {
      setNotifications((prev: any[]) => prev.filter((note) => note.id !== id));
    }, 300);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((note: any) => ({ ...note, read: true }));
    setNotifications(updated);
  };

  const filteredNotifications =
    filter === "All"
      ? notifications
      : notifications.filter((note: { type: any; }) => note.type === filter);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <button
          onClick={handleMarkAllAsRead}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        {["All", "User", "System"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as "All" | "User" | "System")}
            className={`px-4 py-2 rounded transition-all text-sm font-medium ${
              filter === type
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((note) => (
            <div
              key={note.id}
              className={`bg-white border border-gray-200 p-4 rounded-lg shadow-sm relative transition-all duration-300 ${
                dismissed.includes(note.id)
                  ? "opacity-0 scale-95"
                  : "opacity-100 scale-100"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`mt-1 ${
                    note.type === "System" ? "text-blue-500" : "text-green-500"
                  }`}
                >
                  {note.type === "System" ? (
                    <FaExclamationCircle />
                  ) : (
                    <FaCheckCircle />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`font-medium ${
                      note.read ? "text-gray-500" : "text-gray-800"
                    }`}
                  >
                    {note.message}
                  </div>
                  <div className="text-gray-400 text-sm">{note.time}</div>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(note.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              >
                <FaTimes />
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No notifications found.</p>
        )}
      </div>
    </div>
  );
}
import Sidebar from "../components/common/Sidebar";

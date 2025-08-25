import React, { useState, useEffect } from "react";

type Notification = {
  id: number;
  type: "system" | "user";
  icon: string;
  message: string;
  time: string;
  read: boolean;
};

const defaultNotifications: Notification[] = [
  {
    id: 1,
    type: "system",
    icon: "⬇️",
    message: "New braille device connected.",
    time: "Just now",
    read: false,
  },
  {
    id: 2,
    type: "user",
    icon: "✅",
    message: "Profile updated successfully.",
    time: "10 mins ago",
    read: false,
  },
  {
    id: 3,
    type: "system",
    icon: "⬇️",
    message: "New firmware available.",
    time: "1 hour ago",
    read: false,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : defaultNotifications;
  });

  const [filter, setFilter] = useState<"all" | "user" | "system">("all");
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const filtered = notifications.filter((n) =>
    filter === "all" ? true : n.type === filter
  );

  const handleDismiss = (id: number) => {
    setDismissed((prev) => [...prev, id]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((note) => note.id !== id));
    }, 300);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button
          onClick={handleMarkAllAsRead}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Mark all as read
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4 mb-6">
        {["all", "user", "system"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as "all" | "user" | "system")}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              filter === type
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((note) => (
            <div
              key={note.id}
              className={`bg-white border p-4 rounded shadow relative transition duration-300 flex justify-between items-center ${
                dismissed.includes(note.id)
                  ? "opacity-0 scale-95"
                  : "opacity-100 scale-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-blue-600 text-xl">{note.icon}</div>
                <div>
                  <p
                    className={`font-medium ${
                      note.read ? "text-gray-500" : "text-gray-800"
                    }`}
                  >
                    {note.message}
                  </p>
                  <p className="text-sm text-gray-400">{note.time}</p>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(note.id)}
                className="text-gray-400 hover:text-red-500 text-xl font-bold"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">You have no new notifications.</p>
        )}
      </div>
    </div>
  );
}

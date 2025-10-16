import React, { useState, useEffect } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";

interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
}

interface Routine{
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  schedule?: Schedule | null;
}

const RoutinePage: React.FC = () => {
  const [routes, setRoutes] = useState<Routine[]>(() => {
    const saved = localStorage.getItem("routes");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 1,
        name: "Morning Routine",
        description: "Initialize braille display and calibrate pins.",
        isActive: true,
        schedule: {
          days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          startTime: "05:00",
          endTime: "08:00",
        },
      },
      {
        id: 2,
        name: "Afternoon Routine",
        description: "Perform mid-day maintenance and diagnostics.",
        isActive: false,
        schedule: {
          days: ["Mon", "Wed", "Fri"],
          startTime: "13:00",
          endTime: "15:00",
        },
      },
      {
        id: 3,
        name: "Demo Route",
        description: "Runs demo sequence for visitors.",
        isActive: false,
        schedule: {
          days: ["Sat"],
          startTime: "10:00",
          endTime: "11:30",
        },
      },
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Routine | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: false,
    days: [] as string[],
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    localStorage.setItem("routes", JSON.stringify(routes));
  }, [routes]);

  const handleToggle = (id: number) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleDelete = (id: number) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleOpenAddModal = () => {
    setForm({
      name: "",
      description: "",
      isActive: false,
      days: [],
      startTime: "",
      endTime: "",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (route: Routine) => {
    setEditingRoute(route);
    setForm({
      name: route.name,
      description: route.description,
      isActive: route.isActive,
      days: route.schedule?.days || [],
      startTime: route.schedule?.startTime || "",
      endTime: route.schedule?.endTime || "",
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleToggleDay = (day: string) => {
    setForm((prev) => {
      const exists = prev.days.includes(day);
      return {
        ...prev,
        days: exists
          ? prev.days.filter((d) => d !== day)
          : [...prev.days, day],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoute: Routine = {
      id: isEditing && editingRoute ? editingRoute.id : Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
      schedule: {
        days: form.days,
        startTime: form.startTime,
        endTime: form.endTime,
      },
    };

    setRoutes((prev) => {
      if (isEditing && editingRoute) {
        return prev.map((r) => (r.id === editingRoute.id ? newRoute : r));
      }
      return [newRoute, ...prev];
    });

    setIsModalOpen(false);
    setEditingRoute(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Routines Management
        </h1>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          + Add Route
        </button>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <p className="text-gray-500">No routes added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {route.name}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(route)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(route.id)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>

              {/* Schedule */}
              {route.schedule && (
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Time:</strong>{" "}
                    {route.schedule.startTime || "--:--"} -{" "}
                    {route.schedule.endTime || "--:--"}
                  </p>
                  <p>
                    <strong>Days:</strong>{" "}
                    {route.schedule.days.length > 0
                      ? route.schedule.days.join(", ")
                      : "No days selected"}
                  </p>
                </div>
              )}

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                {route.description}
              </p>

              {/* Status */}
              <div className="flex justify-between items-center mt-4">
                <span
                  className={`font-medium ${
                    route.isActive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {route.isActive ? "ACTIVE" : "PAUSED"}
                </span>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={route.isActive}
                    onChange={() => handleToggle(route.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors duration-300 ${
                      route.isActive ? "bg-blue-600" : "bg-gray-400"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
                        route.isActive ? "translate-x-5" : "translate-x-1"
                      }`}
                    ></div>
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Route Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              {isEditing ? "Edit Route" : "Add New Route"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Route Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Route Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Schedule */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Days of the week
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-2 py-1 rounded-md text-sm ${
                          form.days.includes(day)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {day}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Time range */}
              <div className="flex justify-between space-x-2">
                <div className="flex flex-col w-1/2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    className="border border-gray-300 dark:border-gray-600 rounded-md p-1"
                  />
                </div>
                <div className="flex flex-col w-1/2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    className="border border-gray-300 dark:border-gray-600 rounded-md p-1"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Active by default?
                </label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  {isEditing ? "Save Changes" : "Add Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutinePage;

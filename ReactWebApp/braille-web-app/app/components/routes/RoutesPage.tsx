import React, { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";

interface Route {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  isDefault?: boolean;
}

const RoutesPage: React.FC = () => {
  const defaultRoutes: Route[] = [
    {
      id: 1,
      name: "Morning Routine",
      description: "Initialize braille display and calibrate pins.",
      isActive: true,
      isDefault: true,
    },
    {
      id: 2,
      name: "Afternoon Routine",
      description: "Perform mid-day maintenance and diagnostics.",
      isActive: false,
      isDefault: true,
    },
    {
      id: 3,
      name: "Demo Route",
      description: "Runs demo sequence for visitors.",
      isActive: false,
      isDefault: true,
    },
  ];

  const [routes, setRoutes] = useState<Route[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: "",
    description: "",
    isActive: false,
  });

  // ✅ Load from localStorage or restore defaults if missing
  useEffect(() => {
    try {
      const saved = localStorage.getItem("routes");
      if (saved) {
        const parsed: Route[] = JSON.parse(saved);

        // Ensure defaults exist even if user deleted them
        const merged = [
          ...defaultRoutes.filter(
            (def) => !parsed.some((r) => r.name === def.name)
          ),
          ...parsed,
        ];

        setRoutes(merged);
        localStorage.setItem("routes", JSON.stringify(merged));
      } else {
        setRoutes(defaultRoutes);
        localStorage.setItem("routes", JSON.stringify(defaultRoutes));
      }
    } catch {
      // fallback if localStorage is corrupted
      setRoutes(defaultRoutes);
      localStorage.setItem("routes", JSON.stringify(defaultRoutes));
    }
  }, []);

  // ✅ Persist on every change
  useEffect(() => {
    if (routes.length > 0) {
      localStorage.setItem("routes", JSON.stringify(routes));
    }
  }, [routes]);

  const toggleRoute = (id: number) => {
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      )
    );
  };

  const handleAddRoute = () => setIsModalOpen(true);
  const handleModalClose = () => {
    setIsModalOpen(false);
    setNewRoute({ name: "", description: "", isActive: false });
  };

  const handleDeleteRoute = (id: number) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.name.trim()) return;

    const nextId =
      routes.length > 0 ? Math.max(...routes.map((r) => r.id)) + 1 : 1;

    const newEntry: Route = {
      id: nextId,
      name: newRoute.name.trim(),
      description: newRoute.description.trim(),
      isActive: newRoute.isActive,
      isDefault: false,
    };

    setRoutes((prev) => [...prev, newEntry]);
    handleModalClose();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Routes Management
        </h1>
        <button
          onClick={handleAddRoute}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          + Add Route
        </button>
      </div>

      {/* Routes grid */}
      {routes.length === 0 ? (
        <p className="text-gray-500">No routes added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {routes.map((route) => (
            <div
              key={route.id}
              className="group relative bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex flex-col justify-between transition-transform hover:scale-[1.01]"
            >
              {!route.isDefault && (
                <button
                  onClick={() => handleDeleteRoute(route.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-600 bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaTrash size={14} />
                </button>
              )}

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {route.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {route.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    route.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {route.isActive ? "ON" : "OFF"}
                </span>

                <label className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={route.isActive}
                    onChange={() => toggleRoute(route.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600"></div>
                  <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-full"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative transform transition-all scale-100 hover:scale-[1.01]">
            <button
              onClick={handleModalClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Add New Route
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Route Name
                </label>
                <input
                  type="text"
                  value={newRoute.name}
                  onChange={(e) =>
                    setNewRoute((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Evening Routine"
                  required
                  className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={newRoute.description}
                  onChange={(e) =>
                    setNewRoute((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="e.g. Run evening calibration routine"
                  className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active by default?
                </label>
                <label className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoute.isActive}
                    onChange={() =>
                      setNewRoute((prev) => ({
                        ...prev,
                        isActive: !prev.isActive,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600"></div>
                  <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-full"></div>
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 border border-gray-400 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Add Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesPage;

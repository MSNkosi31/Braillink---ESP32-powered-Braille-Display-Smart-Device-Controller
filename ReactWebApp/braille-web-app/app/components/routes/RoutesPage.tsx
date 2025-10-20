// app/components/routes/RoutesPage.tsx
// Main Routines page: top devices grid + bottom routines list with filters.

import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import RouteDrawer from "./RouteDrawer";
import type { RoutineDraft, Schedule } from "./RouteDrawer";
import RouteRow, { Routine } from "./RouteRow";

// ----- Device type: match DevicesManagement.tsx -----
export interface Device {
  id: string;
  name: string;
  type: "light" | "temp" | "door" | "voice";
  status: boolean;
  location: string;
  deviceTopic: string;
  deviceStatusTopic: string;
  battery?: number;
}

type StatusFilter = "all" | "active";
const LS_KEY = "braille_routines_v1";

const API_BASE = "https://braillink-api.ngrok.app/api";

// API response shapes used in your DevicesManagement.tsx
interface ApiDevice {
  _id: string;
  deviceName: string;
  deviceTopic: string;
  deviceStatusTopic: string;
}
interface Room {
  roomName: string;
  devices: ApiDevice[];
}
interface ApiResponse {
  rooms: Room[];
}

const transformApiDataToDevices = (apiData: ApiResponse): Device[] => {
  const acc: Device[] = [];
  apiData.rooms.forEach((room) => {
    room.devices.forEach((apiDevice) => {
      const getDeviceType = (
        name: string
      ): "light" | "temp" | "door" | "voice" => {
        const lower = name.toLowerCase();
        if (lower.includes("light") || lower.includes("lamp")) return "light";
        if (lower.includes("temp") || lower.includes("thermo")) return "temp";
        if (lower.includes("door") || lower.includes("lock")) return "door";
        if (lower.includes("voice") || lower.includes("speaker")) return "voice";
        return "light";
      };
      acc.push({
        id: apiDevice._id,
        name: apiDevice.deviceName,
        type: getDeviceType(apiDevice.deviceName),
        status: false,
        location: room.roomName,
        deviceTopic: apiDevice.deviceTopic,
        deviceStatusTopic: apiDevice.deviceStatusTopic,
      });
    });
  });
  return acc;
};

const loadRoutines = (): Routine[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveRoutines = (routines: Routine[]) => {
  localStorage.setItem(LS_KEY, JSON.stringify(routines));
};

const formatScheduleInline = (schedule?: Schedule | null) => {
  if (!schedule || schedule.days.length === 0 || !schedule.startTime || !schedule.endTime) {
    return "No schedule";
  }
  return `${schedule.days.join(", ")} | ${schedule.startTime} - ${schedule.endTime}`;
};

const RoutesPage: React.FC = () => {
  // Devices (fetched here so the top section stays in sync with your API)
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Routines state (persisted)
  const [routines, setRoutines] = useState<Routine[]>(() => loadRoutines());

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [prefillDeviceIds, setPrefillDeviceIds] = useState<string[] | null>(null);

  // Fetch devices (same transform as DevicesManagement)
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoadingDevices(true);
        setDeviceError(null);
        const res = await fetch(`${API_BASE}/devices`);
        if (!res.ok) throw new Error("Failed to fetch devices");
        const api: ApiResponse = await res.json();
        const transformed = transformApiDataToDevices(api);
        setDevices(transformed);
      } catch (e) {
        setDeviceError("Error fetching devices");
        // non-fatal for routines UI
      } finally {
        setLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  // Persist routines on change
  useEffect(() => {
    saveRoutines(routines);
  }, [routines]);

  // Derived list with filters
  const filteredRoutines = useMemo(() => {
    let list = [...routines];

    if (statusFilter === "active") {
      list = list.filter((r) => r.active);
    }

    if (deviceFilter !== "all") {
      list = list.filter((r) => r.deviceIds.includes(deviceFilter));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          formatScheduleInline(r.schedule).toLowerCase().includes(q)
      );
    }

    return list;
  }, [routines, statusFilter, deviceFilter, query]);

  // Add Routine from top button
  const openAddRoutine = () => {
    setEditingRoutine(null);
    setPrefillDeviceIds(null);
    setDrawerOpen(true);
  };

  // Add Routine from a specific device card
  const openAddRoutineForDevice = (deviceId: string) => {
    setEditingRoutine(null);
    setPrefillDeviceIds([deviceId]);
    setDrawerOpen(true);
  };

  // Edit Routine
  const openEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setPrefillDeviceIds(null);
    setDrawerOpen(true);
  };

  const handleSaveRoutine = (draft: RoutineDraft) => {
    // Upsert
    setRoutines((prev) => {
      const exists = prev.find((r) => r.id === draft.id);
      if (exists) {
        return prev.map((r) => (r.id === draft.id ? { ...draft } : r));
      }
      return [{ ...draft }, ...prev];
    });
    setDrawerOpen(false);
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = (id: string) => {
    if (!confirm("Delete this routine?")) return;
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Routines Management</h2>
          <button
            onClick={openAddRoutine}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaPlus />
            <span>Add Routine</span>
          </button>
        </div>
      </div>

      {/* Top: Devices Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Devices</h3>
        </div>

        {deviceError && (
          <p className="text-red-600 text-sm mb-4">{deviceError}</p>
        )}

        {loadingDevices ? (
          <p className="text-gray-500">Loading devices…</p>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No devices found. Add devices first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {device.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {device.location || "Unassigned"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      device.status ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {device.status ? "Online" : "Offline"}
                  </span>
                </div>
                <button
                  onClick={() => openAddRoutineForDevice(device.id)}
                  className="mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  Add Routine
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters + Routines List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold">Routines List</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search routines…"
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-700 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-700 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
            </select>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-700 text-sm"
            >
              <option value="all">All devices</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredRoutines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No routines yet. Create your first routine.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutines.map((routine) => (
              <RouteRow
                key={routine.id}
                routine={routine}
                devices={devices}
                onEdit={() => openEditRoutine(routine)}
                onDelete={() => handleDeleteRoutine(routine.id)}
                onToggle={() => handleToggleActive(routine.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer / Modal */}
      {drawerOpen && (
        <RouteDrawer
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setEditingRoutine(null);
            setPrefillDeviceIds(null);
          }}
          onSave={handleSaveRoutine}
          devices={devices}
          initialRoutine={editingRoutine || undefined}
          preselectDeviceIds={prefillDeviceIds || undefined}
        />
      )}
    </div>
  );
};

export default RoutesPage;

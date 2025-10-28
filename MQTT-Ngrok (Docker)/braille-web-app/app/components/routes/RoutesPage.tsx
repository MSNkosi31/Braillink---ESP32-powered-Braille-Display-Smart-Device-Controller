// app/components/routes/RoutesPage.tsx
// Main Routines page: top devices grid + bottom routines list with filters.

import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import RouteDrawer from "./RouteDrawer";
import type { RoutineDraft, Schedule, DeviceAction } from "./RouteDrawer";
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

const API_BASE = "http://gleanable-tasha-unforbidding.ngrok-free.dev/api";

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

// API Routine interfaces - MATCHING THE ACTUAL API RESPONSE
interface ApiRoutineAction {
  deviceId: {
    _id: string;
    deviceName: string;
    deviceTopic: string;
    deviceStatusTopic: string;
    roomName: string;
  };
  action: string; // "ON", "OFF", or "toggle"
}

interface ApiRoutine {
  _id: string;
  name: string;
  actions: ApiRoutineAction[];
  scheduled: boolean;
  schedule?: {
    daysOfWeek: number[];
    enabled: boolean;
    time?: string;
    cronExpression?: string;
  };
  enabled?: boolean;
  lastExecuted?: string;
  createdAt: string;
}

interface CreateRoutineRequest {
  name: string;
  actions: Array<{
    deviceId: string;
    action: string;
  }>;
  scheduled: boolean;
  time?: string;
  daysOfWeek?: number[];
  enabled: boolean;
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

// API functions for routines
const loadRoutinesFromAPI = async (): Promise<Routine[]> => {
  try {
    const res = await fetch(`${API_BASE}/routines`);
    if (!res.ok) throw new Error("Failed to fetch routines");
    const apiRoutines: ApiRoutine[] = await res.json();

    return apiRoutines.map(apiRoutine => {
      // Convert actions to frontend format - handle both string deviceId and object
      const deviceActions: DeviceAction[] = apiRoutine.actions.map(action => {
        // Extract device ID whether it's a string or object
        const deviceId = typeof action.deviceId === 'string'
          ? action.deviceId
          : action.deviceId._id;

        // Convert "toggle" to "ON" and ensure only ON/OFF
        let normalizedAction: "ON" | "OFF" = "ON";
        if (action.action === "OFF" || action.action === "off") {
          normalizedAction = "OFF";
        }
        // "toggle" and anything else becomes "ON"

        return {
          deviceId,
          action: normalizedAction
        };
      });

      // Convert schedule to frontend format - FIXED to match actual API structure
      const schedule: Schedule | null = apiRoutine.schedule?.time &&
        apiRoutine.schedule.daysOfWeek &&
        apiRoutine.schedule.daysOfWeek.length > 0
        ? {
          days: apiRoutine.schedule.daysOfWeek.map(day =>
            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]
          ),
          time: apiRoutine.schedule.time
        }
        : null;

      return {
        id: apiRoutine._id,
        name: apiRoutine.name,
        description: `Routine with ${apiRoutine.actions.length} action(s)`,
        active: apiRoutine.schedule?.enabled ?? apiRoutine.enabled ?? true,
        deviceIds: deviceActions.map(da => da.deviceId),
        deviceActions: deviceActions,
        schedule: schedule
      };
    });
  } catch (error) {
    console.error('Error loading routines from API:', error);
    return [];
  }
};

const saveRoutineToAPI = async (routine: RoutineDraft): Promise<boolean> => {
  try {
    // Convert frontend format to API format
    const hasSchedule = !!(routine.schedule && routine.schedule.days.length > 0 && routine.schedule.time);
    const daysOfWeek = hasSchedule
      ? routine.schedule.days.map(day =>
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day)
      ).filter(day => day !== -1)
      : [];

    // Use the actual deviceActions - ensure actions are only ON/OFF
    const actions = routine.deviceActions.map(deviceAction => ({
      deviceId: deviceAction.deviceId, // Just the device ID string
      action: deviceAction.action // "ON" or "OFF" only
    }));

    // Step 1: Create/Update the routine basic info
    const routineData = {
      name: routine.name,
      actions: actions
    };

    let routineId = routine.id;
    let method = 'POST';
    let url = `${API_BASE}/routines`;

    // If editing existing routine, use PUT
    if (routineId && !routineId.startsWith('temp-')) {
      url = `${API_BASE}/routines/${routineId}`;
      method = 'PUT';
    }

    console.log('Step 1: Saving routine basic info:', routineData);

    const routineRes = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(routineData)
    });

    if (!routineRes.ok) {
      const errorText = await routineRes.text();
      throw new Error(`HTTP ${routineRes.status}: ${errorText}`);
    }

    // Get the routine ID from response if it was a new routine
    if (method === 'POST') {
      const savedRoutine = await routineRes.json();
      routineId = savedRoutine._id;
    }

    // Step 2: Update the schedule separately
    const scheduleData = {
      scheduled: hasSchedule,
      time: hasSchedule ? routine.schedule.time : "",
      daysOfWeek: daysOfWeek,
      enabled: routine.active
    };

    console.log('Step 2: Saving schedule data:', scheduleData);

    const scheduleRes = await fetch(`${API_BASE}/routines/${routineId}/schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData)
    });

    if (!scheduleRes.ok) {
      const errorText = await scheduleRes.text();
      throw new Error(`HTTP ${scheduleRes.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving routine to API:', error);
    return false;
  }
};

const deleteRoutineFromAPI = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/routines/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (error) {
    console.error('Error deleting routine from API:', error);
    return false;
  }
};

const executeRoutineAPI = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/routines/execute/${id}`, {
      method: 'POST'
    });
    return res.ok;
  } catch (error) {
    console.error('Error executing routine:', error);
    return false;
  }
};

const toggleRoutineScheduleAPI = async (id: string, scheduled: boolean, time: string, daysOfWeek: number[], enabled: boolean): Promise<boolean> => {
  try {
    // Create update object with schedule fields at root level
    const updateData: any = {
      scheduled,
      enabled
    };

    // Only add time and daysOfWeek if they have values
    if (time) {
      updateData.time = time;
    }
    if (daysOfWeek && daysOfWeek.length > 0) {
      updateData.daysOfWeek = daysOfWeek;
    }

    const res = await fetch(`${API_BASE}/routines/${id}/schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    return res.ok;
  } catch (error) {
    console.error('Error toggling routine schedule:', error);
    return false;
  }
};

const formatScheduleInline = (schedule?: Schedule | null) => {
  if (!schedule || schedule.days.length === 0 || !schedule.time) {
    return "No schedule";
  }
  return `${schedule.days.join(", ")} | ${schedule.time}`;
};

interface RoutesPageProps {
  routines?: Routine[];
  setRoutines?: (routines: Routine[]) => void;
  devices?: Device[];
  onExecuteRoutine?: (routineId: string) => void;
}

const RoutesPage: React.FC<RoutesPageProps> = ({
  routines: externalRoutines,
  setRoutines: externalSetRoutines,
  devices: externalDevices,
  onExecuteRoutine
}) => {
  // Devices (fetched here so the top section stays in sync with your API)
  const [devices, setDevices] = useState<Device[]>(externalDevices || []);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Routines state (from API)
  const [internalRoutines, setInternalRoutines] = useState<Routine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState<boolean>(false);
  const [routineError, setRoutineError] = useState<string | null>(null);

  // Use external routines if provided, otherwise use internal state
  const routines = externalRoutines || internalRoutines;
  const setRoutines = externalSetRoutines || setInternalRoutines;

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

    if (!externalDevices) {
      fetchDevices();
    }
  }, [externalDevices]);

  // Fetch routines from API
  useEffect(() => {
    const fetchRoutines = async () => {
      try {
        setLoadingRoutines(true);
        setRoutineError(null);
        const routinesData = await loadRoutinesFromAPI();
        setRoutines(routinesData);
      } catch (error) {
        setRoutineError("Error fetching routines");
        console.error('Error fetching routines:', error);
      } finally {
        setLoadingRoutines(false);
      }
    };

    if (!externalRoutines) {
      fetchRoutines();
    }
  }, [externalRoutines, setRoutines]);

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

  const handleSaveRoutine = async (draft: RoutineDraft) => {
    const success = await saveRoutineToAPI(draft);
    if (success) {
      // Refresh routines from API to get the updated list
      const updatedRoutines = await loadRoutinesFromAPI();
      setRoutines(updatedRoutines);
      setDrawerOpen(false);
      setEditingRoutine(null);
    } else {
      alert("Failed to save routine. Please try again.");
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm("Delete this routine?")) return;

    const success = await deleteRoutineFromAPI(id);
    if (success) {
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert("Failed to delete routine. Please try again.");
    }
  };

  const handleToggleActive = async (id: string) => {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;

    const newActive = !routine.active;

    // Convert schedule to API format
    const daysOfWeek = routine.schedule?.days.map(day =>
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day)
    ).filter(day => day !== -1) || [];

    const success = await toggleRoutineScheduleAPI(
      id,
      !!routine.schedule,
      routine.schedule?.time || "",
      daysOfWeek,
      newActive
    );

    if (success) {
      setRoutines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: newActive } : r))
      );
    } else {
      alert("Failed to update routine status. Please try again.");
    }
  };

  const handleExecuteRoutine = async (id: string) => {
    if (onExecuteRoutine) {
      onExecuteRoutine(id);
    } else {
      const success = await executeRoutineAPI(id);
      if (success) {
        alert("Routine executed successfully!");
      } else {
        alert("Failed to execute routine. Please try again.");
      }
    }
  };

  const displayDevices = externalDevices || devices;

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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Devices</h3>
        </div>

        {deviceError && (
          <p className="text-red-600 text-sm mb-4">{deviceError}</p>
        )}

        {loadingDevices ? (
          <p className="text-gray-500">Loading devices…</p>
        ) : displayDevices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No devices found. Add devices first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayDevices.map((device) => (
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
                    className={`text-xs font-medium ${device.status ? "text-green-600" : "text-red-600"
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
              {displayDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingRoutines ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading routines...</p>
          </div>
        ) : routineError ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{routineError}</p>
          </div>
        ) : filteredRoutines.length === 0 ? (
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
                devices={displayDevices}
                onEdit={() => openEditRoutine(routine)}
                onDelete={() => handleDeleteRoutine(routine.id)}
                onToggle={() => handleToggleActive(routine.id)}
                onExecute={() => handleExecuteRoutine(routine.id)}
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
          devices={displayDevices}
          initialRoutine={editingRoutine || undefined}
          preselectDeviceIds={prefillDeviceIds || undefined}
        />
      )}
    </div>
  );
};

export default RoutesPage;
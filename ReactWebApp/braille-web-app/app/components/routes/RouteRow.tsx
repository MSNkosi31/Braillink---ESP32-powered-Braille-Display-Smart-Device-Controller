// app/components/routes/RouteRow.tsx
// One routine card. Shows name, schedule, devices, Active/Paused toggle, Edit and Delete buttons.

import React, { useMemo } from "react";
import type { Device } from "./RoutesPage";
import { FaEdit, FaTrash, FaPlay } from "react-icons/fa";

export interface Schedule {
  days: string[];
  time: string; // Single time field for execution
}

export interface DeviceAction {
  deviceId: string;
  action: "ON" | "OFF";
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  active: boolean;
  deviceIds: string[];
  deviceActions: DeviceAction[];
  schedule: Schedule | null;
}

interface Props {
  routine: Routine;
  devices: Device[];
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onExecute?: () => void;
}

const RouteRow: React.FC<Props> = ({ routine, devices, onEdit, onDelete, onToggle, onExecute }) => {
  const deviceNames = useMemo(() => {
    const map = new Map(devices.map((d) => [d.id, d.name]));
    return routine.deviceIds.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [devices, routine.deviceIds]);

  // Get device actions with names for display
  const deviceActionsDisplay = useMemo(() => {
    const deviceMap = new Map(devices.map((d) => [d.id, d.name]));
    return routine.deviceActions.map(da => {
      const deviceName = deviceMap.get(da.deviceId) || "Unknown Device";
      return `${deviceName} (${da.action})`;
    });
  }, [devices, routine.deviceActions]);

  const scheduleLabel = useMemo(() => {
    if (!routine.schedule || routine.schedule.days.length === 0) return "No schedule set";
    const { days, time } = routine.schedule;
    if (!time) return `${days.join(", ")} | --:--`;
    return `${days.join(", ")} | ${time}`;
  }, [routine.schedule]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {routine.name}
            </h4>
            <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {scheduleLabel}
            </div>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {deviceActionsDisplay.length > 0 ? (
            <div>Actions: {deviceActionsDisplay.join(", ")}</div>
          ) : (
            <div>No actions configured</div>
          )}
        </div>

        {routine.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {routine.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <span
          className={`text-sm font-medium ${routine.active ? "text-green-600" : "text-red-600"
            }`}
        >
          {routine.active ? "ACTIVE" : "PAUSED"}
        </span>

        <div className="flex items-center gap-2">
          {onExecute && (
            <button
              onClick={onExecute}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm flex items-center gap-1"
              title="Execute routine"
            >
              <FaPlay />
            </button>
          )}
          <button
            onClick={onEdit}
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm flex items-center gap-1"
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex items-center gap-1"
          >
            <FaTrash /> Delete
          </button>

          <label className="inline-flex items-center cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={routine.active}
              onChange={onToggle}
              className="sr-only"
            />
            <div
              className={`w-10 h-5 rounded-full transition-colors duration-300 ${routine.active ? "bg-blue-600" : "bg-gray-400"
                }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${routine.active ? "translate-x-5" : "translate-x-1"
                  }`}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default RouteRow;
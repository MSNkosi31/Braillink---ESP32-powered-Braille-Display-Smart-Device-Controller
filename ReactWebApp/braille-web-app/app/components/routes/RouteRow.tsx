// app/components/routes/RouteRow.tsx
// One routine card. Shows name, schedule, devices, Active/Paused toggle, Edit and Delete buttons.

import React, { useMemo } from "react";
import type { Device } from "./RoutesPage";
import { FaEdit, FaTrash } from "react-icons/fa";

export interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  active: boolean;
  deviceIds: string[];
  schedule: Schedule | null;
}

interface Props {
  routine: Routine;
  devices: Device[];
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

const RouteRow: React.FC<Props> = ({ routine, devices, onEdit, onDelete, onToggle }) => {
  const deviceNames = useMemo(() => {
    const map = new Map(devices.map((d) => [d.id, d.name]));
    return routine.deviceIds.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [devices, routine.deviceIds]);

  const scheduleLabel = useMemo(() => {
    if (!routine.schedule || routine.schedule.days.length === 0) return "No schedule set";
    const { days, startTime, endTime } = routine.schedule;
    if (!startTime || !endTime) return `${days.join(", ")} | --:-- - --:--`;
    return `${days.join(", ")} | ${startTime} - ${endTime}`;
    // If you want AM/PM formatting, convert here.
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
          {deviceNames.length > 0 ? (
            <div>Devices: {deviceNames.join(", ")}</div>
          ) : (
            <div>Devices: None selected</div>
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
          className={`text-sm font-medium ${
            routine.active ? "text-green-600" : "text-red-600"
          }`}
        >
          {routine.active ? "ACTIVE" : "PAUSED"}
        </span>

        <div className="flex items-center gap-2">
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
              className={`w-10 h-5 rounded-full transition-colors duration-300 ${
                routine.active ? "bg-blue-600" : "bg-gray-400"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  routine.active ? "translate-x-5" : "translate-x-1"
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

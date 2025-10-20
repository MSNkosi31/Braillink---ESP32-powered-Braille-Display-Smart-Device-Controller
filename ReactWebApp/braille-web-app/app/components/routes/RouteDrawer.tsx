// app/components/routes/RouteDrawer.tsx
// Add/Edit Routine modal. Allows multiple devices, multi-day selection, start/end time.


import React, { useEffect, useMemo, useState } from "react";
import type { Device } from "./RoutesPage";

export interface Schedule {
  days: string[];
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface RoutineDraft {
  id: string;
  name: string;
  description: string;
  active: boolean;
  deviceIds: string[];
  schedule: Schedule | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: RoutineDraft) => void;
  devices: Device[];
  initialRoutine?: RoutineDraft; // when editing
  preselectDeviceIds?: string[]; // when coming from a device card
}

const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RouteDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  devices,
  initialRoutine,
  preselectDeviceIds,
}) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [active, setActive] = useState<boolean>(true);
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    if (initialRoutine) {
      setName(initialRoutine.name);
      setDescription(initialRoutine.description);
      setActive(initialRoutine.active);
      setDeviceIds(initialRoutine.deviceIds);
      setDays(initialRoutine.schedule?.days || []);
      setStartTime(initialRoutine.schedule?.startTime || "");
      setEndTime(initialRoutine.schedule?.endTime || "");
      return;
    }

    setName("");
    setDescription("");
    setActive(true);
    setDeviceIds(preselectDeviceIds || []);
    setDays([]);
    setStartTime("");
    setEndTime("");
  }, [isOpen, initialRoutine, preselectDeviceIds]);

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (deviceIds.length === 0) return false;
    // Schedule optional, but if filled, require both times
    if ((startTime && !endTime) || (!startTime && endTime)) return false;
    return true;
  }, [name, deviceIds, startTime, endTime]);

  const toggleDevice = (id: string) => {
    setDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (!canSave) return;

    const draft: RoutineDraft = {
      id: initialRoutine?.id || String(Date.now()),
      name: name.trim(),
      description: description.trim(),
      active,
      deviceIds: [...deviceIds],
      schedule:
        days.length > 0 && startTime && endTime
          ? { days: [...days], startTime, endTime }
          : null,
    };

    onSave(draft);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div className="absolute inset-x-0 top-16 mx-auto w-full max-w-xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700 mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {initialRoutine ? "Edit Routine" : "Add Routine"}
            </h2>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Routine Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter routine name"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-700"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What does this routine do?"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-700"
              />
            </div>

            {/* Devices multi-select buttons */}
            <div>
              <label className="block text-sm font-medium mb-2">Devices</label>
              {devices.length === 0 ? (
                <p className="text-sm text-gray-500">No devices available.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {devices.map((d) => {
                    const selected = deviceIds.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDevice(d.id)}
                        className={`text-left border rounded-md px-3 py-2 text-sm transition ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-gray-500">{d.location || "Unassigned"}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium mb-2">Schedule (optional)</label>
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-2">
                  {dayOptions.map((day) => {
                    const selected = days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-2 py-1 rounded-md text-sm border ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Start</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-2 bg-gray-50 dark:bg-gray-700"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">End</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-2 bg-gray-50 dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm">Active by default?</label>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`px-4 py-2 rounded-md text-white ${
                canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              {initialRoutine ? "Save Changes" : "Add Routine"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDrawer;

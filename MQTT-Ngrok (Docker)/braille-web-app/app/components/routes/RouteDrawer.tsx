// app/components/routes/RouteDrawer.tsx
// Add/Edit Routine modal. Allows multiple devices with ON/OFF actions, multi-day selection.

import React, { useEffect, useMemo, useState } from "react";
import type { Device } from "./RoutesPage";

export interface Schedule {
  days: string[];
  time: string; // "HH:mm" - single time for execution
}

export interface DeviceAction {
  deviceId: string;
  action: "ON" | "OFF";
}

export interface RoutineDraft {
  id: string;
  name: string;
  description: string;
  active: boolean;
  deviceIds: string[];
  deviceActions: DeviceAction[];
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
  const [deviceActions, setDeviceActions] = useState<DeviceAction[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  // Get deviceIds from deviceActions for compatibility
  const deviceIds = useMemo(() =>
    deviceActions?.map(da => da.deviceId) || [],
    [deviceActions]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (initialRoutine) {
      setName(initialRoutine.name);
      setDescription(initialRoutine.description);
      setActive(initialRoutine.active);
      setDeviceActions(initialRoutine.deviceActions || []);
      setDays(initialRoutine.schedule?.days || []);
      setTime(initialRoutine.schedule?.time || "");
      return;
    }

    // Initialize with preselect devices or empty
    const initialDeviceActions = (preselectDeviceIds || []).map(deviceId => ({
      deviceId,
      action: "ON" as const
    }));

    setName("");
    setDescription("");
    setActive(true);
    setDeviceActions(initialDeviceActions);
    setDays([]);
    setTime("");
  }, [isOpen, initialRoutine, preselectDeviceIds]);

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (!deviceActions || deviceActions.length === 0) return false;
    // If schedule is set, require both time and at least one day
    if (time && days.length === 0) return false;
    if (days.length > 0 && !time) return false;
    return true;
  }, [name, deviceActions, time, days]);

  const toggleDevice = (deviceId: string) => {
    setDeviceActions(prev => {
      const existing = prev?.find(da => da.deviceId === deviceId);
      if (existing) {
        // Remove device
        return prev.filter(da => da.deviceId !== deviceId);
      } else {
        // Add device with default ON action
        return [...(prev || []), { deviceId, action: "ON" }];
      }
    });
  };

  const updateDeviceAction = (deviceId: string, action: "ON" | "OFF") => {
    setDeviceActions(prev =>
      prev?.map(da =>
        da.deviceId === deviceId ? { ...da, action } : da
      ) || []
    );
  };

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!canSave || saving) return;

    setSaving(true);

    const draft: RoutineDraft = {
      id: initialRoutine?.id || `temp-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      active,
      deviceIds: deviceActions?.map(da => da.deviceId) || [],
      deviceActions: [...(deviceActions || [])],
      schedule:
        days.length > 0 && time
          ? { days: [...days], time }
          : null,
    };

    console.log('Saving routine draft:', draft);

    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      {/* Panel */}
      <div className="absolute inset-x-0 top-16 mx-auto w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700 mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {initialRoutine ? "Edit Routine" : "Add Routine"}
            </h2>
            <button
              onClick={handleClose}
              disabled={saving}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Routine Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter routine name"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-700"
                disabled={saving}
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
                disabled={saving}
              />
            </div>

            {/* Devices multi-select with actions */}
            <div>
              <label className="block text-sm font-medium mb-2">Devices *</label>
              {devices.length === 0 ? (
                <p className="text-sm text-gray-500">No devices available.</p>
              ) : (
                <div className="space-y-2">
                  {devices.map((device) => {
                    const deviceAction = deviceActions?.find(da => da.deviceId === device.id);
                    const isSelected = !!deviceAction;

                    return (
                      <div
                        key={device.id}
                        className={`border rounded-md p-3 transition ${isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDevice(device.id)}
                              disabled={saving}
                              className="w-4 h-4"
                            />
                            <div>
                              <div className="font-medium">{device.name}</div>
                              <div className="text-xs text-gray-500">{device.location || "Unassigned"}</div>
                            </div>
                          </div>

                          {isSelected && deviceAction && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => updateDeviceAction(device.id, "ON")}
                                disabled={saving}
                                className={`px-3 py-1 rounded text-sm font-medium ${deviceAction.action === "ON"
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                  } disabled:opacity-50`}
                              >
                                ON
                              </button>
                              <button
                                type="button"
                                onClick={() => updateDeviceAction(device.id, "OFF")}
                                disabled={saving}
                                className={`px-3 py-1 rounded text-sm font-medium ${deviceAction.action === "OFF"
                                  ? "bg-red-600 text-white"
                                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                  } disabled:opacity-50`}
                              >
                                OFF
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Select devices and choose ON/OFF action for each</p>
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
                        disabled={saving}
                        className={`px-2 py-1 rounded-md text-sm border transition ${selected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Execution Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-2 bg-gray-50 dark:bg-gray-700"
                      disabled={saving}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {!time
                    ? "Leave empty for manual execution only"
                    : "Select days and time for scheduled execution"}
                </p>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active-toggle"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={saving}
                className="w-4 h-4"
              />
              <label htmlFor="active-toggle" className="text-sm">
                Active routine
              </label>
            </div>
          </div>

          {/* Validation message */}
          {!canSave && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please fill in all required fields: routine name and at least one device.
                {(time && days.length === 0) && " Select at least one day for scheduling."}
                {(days.length > 0 && !time) && " Select a time for scheduling."}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className={`px-4 py-2 rounded-md text-white transition ${canSave && !saving
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
                }`}
            >
              {saving ? "Saving..." : initialRoutine ? "Save Changes" : "Add Routine"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDrawer;
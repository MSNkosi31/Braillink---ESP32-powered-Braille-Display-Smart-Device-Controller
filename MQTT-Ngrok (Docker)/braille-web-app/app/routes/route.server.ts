// Server-side route model helpers and a temporary in-memory store.
// Replace with your real DB calls when ready.

export type RunResult = "SUCCESS" | "FAIL" | "CANCELLED";
export type RouteStatus = "ACTIVE" | "PAUSED" | "DRAFT" | "ERROR";

export interface RouteSummary {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  status: RouteStatus;
  stepsCount: number;
  linkedDevices: { id: string; name: string }[];
  schedule?: { cron?: string; timezone?: string; nextRun?: string };
  lastRun?: { at: string; result: RunResult; durationMs?: number; errorMessage?: string };
  createdBy: { id: string; name: string };
  updatedAt: string;
  usageCount?: number;
  activity?: Array<{
    id: string;
    at: string;
    result: RunResult;
    durationMs?: number;
    message?: string;
  }>;
}

// Temporary in-memory data for local development and UI wiring.
let ROUTES: RouteSummary[] = [
  {
    id: "r-101",
    name: "Morning Boot Sequence",
    description: "Power on and calibrate devices for morning session.",
    tags: ["daily", "morning"],
    status: "ACTIVE",
    stepsCount: 4,
    linkedDevices: [{ id: "d1", name: "Braille Controller A" }, { id: "d2", name: "Panel Lift" }],
    schedule: { cron: "0 6 * * *", timezone: "Africa/Johannesburg", nextRun: new Date(Date.now() + 3600_000).toISOString() },
    lastRun: { at: new Date(Date.now() - 86_400_000).toISOString(), result: "SUCCESS", durationMs: 4200 },
    createdBy: { id: "u1", name: "Lesedi" },
    updatedAt: new Date().toISOString(),
    usageCount: 128,
    activity: [
      { id: "a1", at: new Date(Date.now() - 86_400_000).toISOString(), result: "SUCCESS", durationMs: 4200, message: "Ran end-to-end." },
      { id: "a2", at: new Date(Date.now() - 2 * 86_400_000).toISOString(), result: "SUCCESS", durationMs: 3900 }
    ]
  },
  {
    id: "r-102",
    name: "Demo Routine",
    description: "Short sequence for demo stations.",
    tags: ["demo"],
    status: "PAUSED",
    stepsCount: 2,
    linkedDevices: [{ id: "d3", name: "Braille Controller B" }],
    schedule: { cron: "*/30 * * * *", timezone: "Africa/Johannesburg" },
    createdBy: { id: "u2", name: "Duan" },
    updatedAt: new Date(Date.now() - 7200_000).toISOString(),
    usageCount: 54,
    activity: [
      { id: "a3", at: new Date(Date.now() - 3 * 86_400_000).toISOString(), result: "CANCELLED" }
    ]
  },
  {
    id: "r-103",
    name: "Calibration & Health Check",
    description: "Calibrate pins and run diagnostics.",
    tags: ["maintenance"],
    status: "ERROR",
    stepsCount: 5,
    linkedDevices: [{ id: "d4", name: "Pin Array C" }],
    lastRun: { at: new Date(Date.now() - 3600_000).toISOString(), result: "FAIL", errorMessage: "Timeout on step 3" },
    createdBy: { id: "u1", name: "Lesedi" },
    updatedAt: new Date().toISOString(),
    usageCount: 11,
    activity: [
      { id: "a4", at: new Date(Date.now() - 3600_000).toISOString(), result: "FAIL", message: "Timeout on step 3" }
    ]
  }
];

export type ListParams = {
  q?: string;
  status?: RouteStatus | "ALL";
  sort?: "name" | "lastRun" | "nextRun" | "usage";
};

export async function listRoutes(params: ListParams = {}): Promise<RouteSummary[]> {
  const q = (params.q ?? "").toLowerCase().trim();
  let out = ROUTES.slice();

  if (q) {
    out = out.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q) ||
      (r.tags ?? []).some(t => t.toLowerCase().includes(q)) ||
      r.linkedDevices.some(d => d.name.toLowerCase().includes(q))
    );
  }

  if (params.status && params.status !== "ALL") {
    out = out.filter(r => r.status === params.status);
  }

  switch (params.sort) {
    case "name":
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "lastRun":
      out.sort((a, b) => (b.lastRun?.at ? Date.parse(b.lastRun.at) : 0) - (a.lastRun?.at ? Date.parse(a.lastRun.at) : 0));
      break;
    case "nextRun":
      out.sort((a, b) => (b.schedule?.nextRun ? Date.parse(b.schedule.nextRun) : 0) - (a.schedule?.nextRun ? Date.parse(a.schedule.nextRun) : 0));
      break;
    case "usage":
      out.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
      break;
  }

  return out;
}

export async function getRoute(id: string) {
  return ROUTES.find(r => r.id === id) ?? null;
}

export async function playRoute(id: string) {
  const r = ROUTES.find(x => x.id === id);
  if (!r) throw new Error("Route not found");

  // Simulate a run and update lastRun/activity.
  const now = new Date().toISOString();
  const success = r.status !== "ERROR";
  const result: RunResult = success ? "SUCCESS" : "FAIL";
  const durationMs = Math.floor(Math.random() * 2000) + 1500;

  r.lastRun = { at: now, result, durationMs, errorMessage: success ? undefined : "Simulated failure" };
  r.activity = [{ id: `a-${Math.random()}`, at: now, result, durationMs }, ...(r.activity ?? [])];
  r.updatedAt = now;
  if (!success) r.status = "ERROR";

  return r;
}

export async function pauseRoute(id: string) {
  const r = ROUTES.find(x => x.id === id);
  if (!r) throw new Error("Route not found");
  r.status = "PAUSED";
  if (r.schedule) r.schedule.nextRun = undefined;
  r.updatedAt = new Date().toISOString();
  return r;
}

export async function resumeRoute(id: string) {
  const r = ROUTES.find(x => x.id === id);
  if (!r) throw new Error("Route not found");
  r.status = "ACTIVE";
  if (r.schedule) r.schedule.nextRun = new Date(Date.now() + 3600_000).toISOString();
  r.updatedAt = new Date().toISOString();
  return r;
}

export async function deleteRoute(id: string) {
  ROUTES = ROUTES.filter(x => x.id !== id);
}

import * as React from "react";
import type { RouteSummary } from "~/routes/route.server";

type Props = {
  route: RouteSummary | null;
  onClose: () => void;
};

// Accessible drawer that overlays on the list page to show summary, steps, schedule, and activity.

export function RouteDrawer({ route, onClose }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!route) return null;

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${route.name}`}
        onClick={(e) => e.stopPropagation()}
        ref={ref}
      >
        <div className="drawer-header">
          <h2 className="drawer-title">{route.name}</h2>
          <button className="icon-btn" aria-label="Close details" onClick={onClose}>Close</button>
        </div>

        <div className="drawer-section">
          <div className="drawer-subtitle">Summary</div>
          <p>{route.description ?? "No description"}</p>
          {route.tags?.length ? <div className="tags">{route.tags.map(t => <span key={t} className="tag">{t}</span>)}</div> : null}
          <div className="kv">
            <div><span className="k">Status</span><span className="v">{route.status}</span></div>
            <div><span className="k">Steps</span><span className="v">{route.stepsCount}</span></div>
            <div><span className="k">Devices</span><span className="v">{route.linkedDevices.map(d => d.name).join(", ") || "None"}</span></div>
            <div><span className="k">Last run</span><span className="v">{route.lastRun?.at ? new Date(route.lastRun.at).toLocaleString() : "—"}</span></div>
            <div><span className="k">Next run</span><span className="v">{route.schedule?.nextRun ? new Date(route.schedule.nextRun).toLocaleString() : "—"}</span></div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-subtitle">Activity</div>
          <ul className="activity">
            {(route.activity ?? []).map(a => (
              <li key={a.id}>
                <div className="activity-row">
                  <div className="activity-result">{a.result}</div>
                  <div className="activity-time">{new Date(a.at).toLocaleString()}</div>
                  <div className="activity-meta">
                    {a.durationMs ? `${Math.round(a.durationMs / 1000)}s` : ""}
                    {a.message ? ` • ${a.message}` : ""}
                  </div>
                </div>
              </li>
            ))}
            {(!route.activity || route.activity.length === 0) && <li className="empty">No activity yet</li>}
          </ul>
        </div>
      </aside>
    </div>
  );
}

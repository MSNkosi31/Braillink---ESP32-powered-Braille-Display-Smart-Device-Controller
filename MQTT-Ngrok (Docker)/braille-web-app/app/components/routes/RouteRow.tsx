import * as React from "react";
import { Form, useFetcher } from "@remix-run/react";
import { StatusChip } from "../ui/StatusChip";
import type { RouteSummary } from "~/routes/route.server";

// Reusable table row component for a single route.
// Uses fetcher for Play to avoid a full navigation and supports optimistic "Running..." state.

type Props = {
  route: RouteSummary;
  onOpenDrawer: (routeId: string) => void;
};

export function RouteRow({ route, onOpenDrawer }: Props) {
  const fetcher = useFetcher();
  const isRunning = fetcher.state !== "idle" && fetcher.formData?.get("_action") === "play" && fetcher.formData?.get("id") === route.id;

  return (
    <tr className="route-row" data-status={route.status}>
      <td className="cell-name">
        <button className="link-like" onClick={() => onOpenDrawer(route.id)} aria-label={`Open details for ${route.name}`}>
          <div className="name">{route.name}</div>
        </button>
        {route.tags?.length ? (
          <div className="tags">
            {route.tags.map((t: boolean | React.Key | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        ) : null}
        {route.description ? <div className="desc">{route.description}</div> : null}
      </td>

      <td className="cell-status">
        <StatusChip status={route.status} />
      </td>

      <td className="cell-steps">{route.stepsCount}</td>

      <td className="cell-devices">
        {route.linkedDevices.map((d: { name: any; }) => d.name).join(", ")}
      </td>

      <td className="cell-last-run">
        {route.lastRun?.at ? new Date(route.lastRun.at).toLocaleString() : "—"}
        <div className="subtle">
          {route.lastRun?.result ?? ""}
          {route.lastRun?.durationMs ? ` • ${Math.round(route.lastRun.durationMs / 1000)}s` : ""}
          {route.lastRun?.errorMessage ? ` • ${route.lastRun.errorMessage}` : ""}
        </div>
      </td>

      <td className="cell-next-run">
        {route.schedule?.nextRun ? new Date(route.schedule.nextRun).toLocaleString() : "—"}
      </td>

      <td className="cell-actions">
        <fetcher.Form method="post" className="inline-form">
          <input type="hidden" name="id" value={route.id} />
          <button
            className="btn btn-primary"
            type="submit"
            name="_action"
            value="play"
            disabled={isRunning}
            aria-label={`Run route ${route.name} now`}
          >
            {isRunning ? "Running…" : "Play"}
          </button>
        </fetcher.Form>

        {route.status === "ACTIVE" ? (
          <Form method="post" className="inline-form">
            <input type="hidden" name="id" value={route.id} />
            <button className="btn" type="submit" name="_action" value="pause" aria-label={`Pause ${route.name}`}>
              Pause
            </button>
          </Form>
        ) : (
          <Form method="post" className="inline-form">
            <input type="hidden" name="id" value={route.id} />
            <button className="btn" type="submit" name="_action" value="resume" aria-label={`Resume ${route.name}`}>
              Resume
            </button>
          </Form>
        )}

        <Form method="post" className="inline-form">
          <input type="hidden" name="id" value={route.id} />
          <button className="btn" type="submit" name="_action" value="edit" aria-label={`Edit ${route.name}`}>
            Edit
          </button>
        </Form>

        <Form method="post" className="inline-form" onSubmit={(e: { preventDefault: () => void; }) => {
          if (!confirm(`Delete "${route.name}"? This cannot be undone.`)) e.preventDefault();
        }}>
          <input type="hidden" name="id" value={route.id} />
          <button className="btn btn-danger" type="submit" name="_action" value="delete" aria-label={`Delete ${route.name}`}>
            Delete
          </button>
        </Form>

        <button className="btn link" onClick={() => onOpenDrawer(route.id)} aria-label={`View activity for ${route.name}`}>
          View Activity
        </button>
      </td>
    </tr>
  );
}

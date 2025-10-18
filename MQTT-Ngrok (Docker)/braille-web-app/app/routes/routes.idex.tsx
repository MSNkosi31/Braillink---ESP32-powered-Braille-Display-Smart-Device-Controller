import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import * as React from "react";
import { listRoutes, playRoute, pauseRoute, resumeRoute, deleteRoute, getRoute, type RouteSummary, type RouteStatus } from "~/routes/route.server";
import { RouteRow } from "~/components/routes/RouteRow";
import { RouteDrawer } from "~/components/routes/RouteDrawer";
import stylesHref from "~/styles.css?url";

// Attach page-specific CSS
export function links() {
  return [{ rel: "stylesheet", href: stylesHref }];
}

// Loader: reads query params and returns filtered/sorted list.
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const status = (url.searchParams.get("status") as RouteStatus | "ALL" | null) ?? "ALL";
  const sort = (url.searchParams.get("sort") as "name" | "lastRun" | "nextRun" | "usage" | null) ?? "name";

  const routes = await listRoutes({ q, status, sort });
  return json({ routes, q, status, sort });
}

// Action: handles Play/Pause/Resume/Delete/Edit actions from forms.
export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const actionType = String(form.get("_action"));
  const id = String(form.get("id") ?? "");

  switch (actionType) {
    case "play": {
      await playRoute(id);
      return json({ ok: true, message: "Route started" });
    }
    case "pause": {
      await pauseRoute(id);
      return redirect(request.url);
    }
    case "resume": {
      await resumeRoute(id);
      return redirect(request.url);
    }
    case "delete": {
      await deleteRoute(id);
      return redirect(request.url);
    }
    case "edit": {
      // Redirect to your real edit page when available.
      return redirect(`/routes/${id}/edit`);
    }
    default:
      return json({ ok: false, message: "Unknown action" }, { status: 400 });
  }
}

export default function RoutesIndex() {
  const { routes, q, status, sort } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Drawer state keeps selected route ID and hydrated data from loader or fetch.
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  const routeForDrawer: RouteSummary | null = React.useMemo(() => {
    if (!drawerId) return null;
    return routes.find((r: { id: string; }) => r.id === drawerId) ?? null;
  }, [drawerId, routes]);

  function onOpenDrawer(id: string) {
    setDrawerId(id);
  }
  function onCloseDrawer() {
    setDrawerId(null);
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const next = new URLSearchParams(searchParams);
    next.set("q", String(formData.get("q") ?? ""));
    setSearchParams(next, { replace: false });
  }

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "ALL" || value === "") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: false });
  }

  return (
    <div className="routes-page">
      <header className="page-header">
        <div className="titles">
          <h1>Routes</h1>
          <p className="subtitle">Create, schedule and run multi-step routines.</p>
        </div>

        <div className="header-actions">
          <Form method="get" className="search" onSubmit={onSearchSubmit} role="search">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, tag, or device"
              aria-label="Search routes"
            />
            <button className="btn btn-primary" type="submit">Search</button>
          </Form>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/routes/new")}
          >
            New Route
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="filters">
          <label>
            Status
            <select
              value={status ?? "ALL"}
              onChange={(e) => setFilter("status", e.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="DRAFT">Draft</option>
              <option value="ERROR">Error</option>
            </select>
          </label>

          <label>
            Sort
            <select
              value={sort ?? "name"}
              onChange={(e) => setFilter("sort", e.target.value)}
              aria-label="Sort routes"
            >
              <option value="name">Name</option>
              <option value="lastRun">Last run</option>
              <option value="nextRun">Next run</option>
              <option value="usage">Most used</option>
            </select>
          </label>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="empty-state">
          <h2>No routes yet</h2>
          <p>Create your first route to automate your steps.</p>
          <button className="btn btn-primary" onClick={() => navigate("/routes/new")}>
            Create your first route
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="routes-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Steps</th>
                <th>Devices</th>
                <th>Last run</th>
                <th>Next run</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r: RouteSummary) => (
                <RouteRow key={r.id} route={r} onOpenDrawer={onOpenDrawer} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RouteDrawer route={routeForDrawer} onClose={onCloseDrawer} />
    </div>
  );
}

import type { Route } from "./+types/dashboard";
import Dashboard from "~/components/dashboard/Dashboard";
import ProtectedRoute from "~/components/common/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Braille Display Dashboard" },
    { name: "description", content: "Welcome to Braille Display!" },
  ];
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

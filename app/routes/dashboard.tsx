import type { Route } from "./+types/dashboard";
import Dashboard from "~/components/dashboard/Dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Braille Display Dashboard" },
    { name: "description", content: "Welcome to Braille Display!" },
  ];
}

export default function DashboardPage() {
  return <Dashboard />;
}

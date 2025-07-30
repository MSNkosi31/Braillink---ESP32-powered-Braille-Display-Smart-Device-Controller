// import type { Route } from "./+types/dashboard";
import type { MetaArgs } from "@remix-run/node"; // or the correct path to MetaArgs type
import Dashboard from "~/components/dashboard/Dashboard";
export function meta({}: MetaArgs) {
  return [
    { title: "Braille Display Dashboard" },
    { name: "description", content: "Welcome to Braille Display!" },
  ];
}


export default function DashboardPage() {
  return <Dashboard />;
}

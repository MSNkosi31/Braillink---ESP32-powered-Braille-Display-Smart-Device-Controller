import * as React from "react";

type Props = { status: "ACTIVE" | "PAUSED" | "DRAFT" | "ERROR"; className?: string };

// Uses your CSS variables so it matches your theme automatically.
export function StatusChip({ status, className }: Props) {
  const label = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span
      className={["status-chip", `status-${status.toLowerCase()}`, className].filter(Boolean).join(" ")}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}

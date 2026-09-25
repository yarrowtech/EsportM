import React, { useMemo, useState } from "react";
import { useMe } from "../../hooks/useMe";

export default function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { data } = useMe();
  const memberships = useMemo(() => data?.memberships ?? [], [data?.memberships]);
  const activeClubId = data?.activeClubId || null;

  const [range, setRange] = useState("30d");

  const activeClub = useMemo(
    () => memberships.find((m: any) => m.clubId === activeClubId)?.club,
    [memberships, activeClubId]
  );

  return (
    <div className="p-2 sm:p-3">
      <div
        className="neu-surface mx-auto max-w-7xl rounded-[20px] border p-3 sm:p-4"
        style={{
          borderColor: "rgb(var(--border) / .14)",
          background: "rgb(var(--bg))",
          boxShadow: "var(--neu-raised)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-[rgb(var(--muted))]">
              {activeClub ? `${activeClub.name}` : "No club selected"}
            </div>
            <h1 className="text-2xl font-semibold text-[rgb(var(--text))]">{title}</h1>
          </div>

          <div className="flex gap-2">
            <select
              className="rounded-xl border bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none"
              style={{ borderColor: "rgb(var(--border) / .14)" }}
              value={activeClubId ?? ""}
              onChange={(e) => {
                localStorage.setItem("activeClubId", e.target.value);
                window.location.reload(); // simplest for now
              }}
            >
              {memberships.map((m: any) => (
                <option key={m.clubId} value={m.clubId}>
                  {m.club?.name || m.clubId}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none"
              style={{ borderColor: "rgb(var(--border) / .14)" }}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        <div className="mt-4">{children && React.cloneElement(children as any, { range })}</div>
      </div>
    </div>
  );
}

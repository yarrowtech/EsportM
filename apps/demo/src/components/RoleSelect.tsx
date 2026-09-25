import type { Dispatch, SetStateAction } from "react";

const ROLES = ["Player", "Coach", "Physio", "Agent", "Nutritionist", "Admin"];

export default function RoleSelect({
  role,
  setRole,
}: {
  role: string;
  setRole: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div className="w-full">
      <div className="relative">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={[
            "w-full appearance-none px-4 py-3 rounded-2xl",
            "bg-white/15 text-white shadow-neu-inset",
            "outline-none focus:ring-2 focus:ring-white/40 transition-all",
          ].join(" ")}
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="text-black">
              {r}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/80">
          ▾
        </div>
      </div>
    </div>
  );
}
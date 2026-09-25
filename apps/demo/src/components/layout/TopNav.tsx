import { Pill } from "../ui/Pill";
import { Bell, Settings, UserCircle2 } from "lucide-react";

export function TopNav({
  active,
  onChange,
}: {
  active: string;
  onChange: (v: string) => void;
}) {
  const tabs = [
    "Overview",
    "Teams",
    "Training",
    "Schedule",
    "Medical",
    "Analytics",
    "Finance",
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="hidden lg:flex items-center gap-2 rounded-full bg-white/60 border border-black/10 p-1">
        {tabs.map((t) => (
          <Pill key={t} active={active === t} onClick={() => onChange(t)}>
            {t}
          </Pill>
        ))}
      </div>

      {/* Mobile: compact */}
      <div className="lg:hidden flex-1">
        <select
          value={active}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl bg-white/70 border border-black/10 px-3 py-2 text-sm outline-none"
        >
          {tabs.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button className="h-10 w-10 rounded-2xl bg-white/70 border border-black/10 grid place-items-center hover:bg-white transition active:scale-[0.98]">
          <Settings size={18} />
        </button>
        <button className="h-10 w-10 rounded-2xl bg-white/70 border border-black/10 grid place-items-center hover:bg-white transition active:scale-[0.98]">
          <Bell size={18} />
        </button>
        <button className="h-10 w-10 rounded-2xl bg-white/70 border border-black/10 grid place-items-center hover:bg-white transition active:scale-[0.98]">
          <UserCircle2 size={20} />
        </button>
      </div>
    </div>
  );
}

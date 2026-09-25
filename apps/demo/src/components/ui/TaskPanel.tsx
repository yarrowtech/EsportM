import { Card } from "./Card";

export function TaskPanel() {
  const tasks = [
    { title: "Upload match highlights", time: "Today • 18:00" },
    { title: "Confirm squad availability", time: "Tomorrow • 10:00" },
    { title: "Update injury report", time: "Tomorrow • 13:00" },
    { title: "Review opponent analysis", time: "Fri • 19:30" },
  ];

  return (
    <Card className="p-0">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">Match Prep</div>
            <div className="text-xs text-white/60 mt-1">
              Tasks & readiness checklist
            </div>
          </div>
          <div className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10">
            2/8
          </div>
        </div>
      </div>

      <div className="px-4 pb-5 space-y-3">
        {tasks.map((t) => (
          <div
            key={t.title}
            className="rounded-2xl bg-white/8 border border-white/10 px-4 py-3 flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium">{t.title}</div>
              <div className="text-[11px] text-white/55 mt-1">{t.time}</div>
            </div>
            <div className="h-6 w-6 rounded-full bg-white/10 border border-white/10" />
          </div>
        ))}
      </div>
    </Card>
  );
}

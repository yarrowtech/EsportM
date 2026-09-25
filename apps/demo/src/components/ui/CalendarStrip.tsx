import { motion } from "framer-motion";

export function CalendarStrip() {
  const days = [
    { day: "Mon", date: "22" },
    { day: "Tue", date: "23" },
    { day: "Wed", date: "24" },
    { day: "Thu", date: "25" },
    { day: "Fri", date: "26" },
    { day: "Sat", date: "27" },
  ];

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">September 2024</div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-white/60 border border-black/10 text-xs">
            August
          </span>
          <span className="px-3 py-1 rounded-full bg-white/60 border border-black/10 text-xs">
            October
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-black/55">
        {days.map((d) => (
          <div key={d.day} className="rounded-2xl bg-white/50 border border-black/5 py-2">
            <div>{d.day}</div>
            <div className="mt-1 font-semibold text-black">{d.date}</div>
          </div>
        ))}
        <div className="rounded-2xl bg-white/40 border border-black/5 py-2">
          <div>Sun</div>
          <div className="mt-1 font-semibold text-black/60">28</div>
        </div>
      </div>

      {/* Events row */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-black text-white px-4 py-3 flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-medium">Weekly Team Sync</div>
            <div className="text-[11px] text-white/70">
              Review match plan & training load
            </div>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-7 rounded-full bg-white/20 border border-white/15" />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl bg-white/70 border border-black/10 px-4 py-3 flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-medium">Recovery Assessment</div>
            <div className="text-[11px] text-black/55">
              Physio check + mobility screening
            </div>
          </div>
          <div className="flex -space-x-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-7 w-7 rounded-full bg-black/10 border border-black/10" />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
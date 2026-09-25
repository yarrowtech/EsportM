import { motion } from "framer-motion";

export function MiniBar({
  label,
  percent,
  colorClass = "bg-yellow-300",
}: {
  label: string;
  percent: number; // 0-100
  colorClass?: string;
}) {
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-black/60">
        <span>{label}</span>
        <span className="tabular-nums">{safe}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-black/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safe}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={["h-full rounded-full", colorClass].join(" ")}
        />
      </div>
    </div>
  );
}
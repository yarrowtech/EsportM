
export function MiniRing({
  value,
  label,
  sublabel,
}: {
  value: number; // 0..100
  label: string;
  sublabel?: string;
}) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  return (
    <div className="flex items-center gap-3">
      <svg width="72" height="72" viewBox="0 0 80 80" className="shrink-0">
        <circle cx="40" cy="40" r={r} stroke="rgb(var(--border))" strokeWidth="10" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke="rgb(var(--ring))"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="45" textAnchor="middle" fontSize="16" fill="rgb(var(--text))" fontWeight="700">
          {pct}%
        </text>
      </svg>

      <div>
        <p className="text-sm font-semibold">{label}</p>
        {sublabel && <p className="text-xs text-[rgb(var(--muted))]">{sublabel}</p>}
      </div>
    </div>
  );
}

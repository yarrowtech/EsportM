
export default function RecentPanel({ title, items, render }: any) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "rgb(var(--border) / .14)",
        background:
          "linear-gradient(145deg, rgba(255,255,255,.72), rgba(255,255,255,.44) 62%, rgba(var(--primary), .10))",
      }}
    >
      <div className="mb-3 text-sm font-semibold text-[rgb(var(--text))]">{title}</div>
      <div className="space-y-2">
        {items?.length ? items.map(render) : <div className="text-sm text-[rgb(var(--muted))]">No data</div>}
      </div>
    </div>
  );
}


export default function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "rgb(var(--border) / .14)",
        background:
          "linear-gradient(145deg, rgba(255,255,255,.76), rgba(255,255,255,.52) 64%, rgba(var(--primary), .08))",
      }}
    >
      <div className="text-xs text-[rgb(var(--muted))]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
    </div>
  );
}

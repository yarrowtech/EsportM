import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function ChartCard({ title, points }: { title: string; points: any[] }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "rgb(var(--border) / .14)",
        background:
          "linear-gradient(145deg, rgba(255,255,255,.72), rgba(255,255,255,.46) 65%, rgba(var(--primary), .12))",
      }}
    >
      <div className="mb-3 text-sm font-semibold text-[rgb(var(--text))]">{title}</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,24,32,.14)" />
            <XAxis dataKey="x" tick={{ fill: "rgb(var(--muted))", fontSize: 11 }} />
            <YAxis tick={{ fill: "rgb(var(--muted))", fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="y"
              dot={false}
              stroke="rgba(var(--primary), .92)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

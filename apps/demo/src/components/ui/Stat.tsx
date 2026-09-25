import { Card } from "./Card";

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-black/55">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
          {hint ? <div className="mt-1 text-xs text-black/45">{hint}</div> : null}
        </div>
        <div className="h-9 w-9 rounded-2xl bg-black/5" />
      </div>
    </Card>
  );
}
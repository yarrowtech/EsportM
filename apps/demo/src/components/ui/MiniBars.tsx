
export function MiniBars({
  values,
  caption,
}: {
  values: number[]; // 0..100
  caption: string;
}) {
  return (
    <div>
      <p className="text-xs text-[rgb(var(--muted))]">{caption}</p>
      <div className="mt-2 flex items-end gap-2">
        {values.slice(0, 7).map((v, i) => (
          <div
            key={i}
            className="w-2 rounded-full"
            style={{
              height: `${Math.max(8, Math.min(80, v))}px`,
              background: i === values.length - 1
                ? `rgb(var(--primary))`
                : `rgba(var(--primary-2), .12)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function TopMetrics() {
  const items = [
    { value: "78", label: "Athletes" },
    { value: "56", label: "Fixtures" },
    { value: "203", label: "Sessions" },
  ];

  return (
    <div className="hidden lg:flex items-center gap-8">
      {items.map((x) => (
        <div key={x.label} className="text-right">
          <div className="text-4xl font-medium tracking-tight">{x.value}</div>
          <div className="text-xs text-black/55 mt-1">{x.label}</div>
        </div>
      ))}
    </div>
  );
}
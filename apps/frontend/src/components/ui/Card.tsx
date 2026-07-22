import React from "react";

export function Card({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        // "rounded-2xl border bg-[rgb(var(--surface))]/85 backdrop-blur-xl shadow-sm",
        // "p-4 md:p-5",
        "rounded-[22px] border bg-white/70 backdrop-blur-md shadow - [0_10px_30px_rgba(20, 24, 32, 0.06)] hover: shadow - [0_14px_38px_rgba(20, 24, 32, 0.09)] transition",
        className,
      ].join(" ")}
      style={{ borderColor: "rgb(var(--border) / .1)" }}
    >
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

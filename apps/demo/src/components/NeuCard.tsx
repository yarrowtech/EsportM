import type { ReactNode } from "react";

export default function NeuCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "bg-bg rounded-3xl shadow-neu p-6 md:p-8 transition-all",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Topbar({
  onToggleSidebar,
  onOpenTheme,
  title,
  subtitle,
}: {
  onToggleSidebar: () => void;
  onOpenTheme: () => void;
  title: string;
  subtitle?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: -12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }
    );
  }, []);

  return (
    <header
      ref={ref}
      className="fixed left-0 right-0 top-0 z-50 border-b bg-[rgb(var(--surface))]/75 backdrop-blur-xl"
      style={{ borderColor: "rgb(var(--border))" }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-3 md:px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="rounded-xl border px-3 py-2 text-xs font-semibold md:hidden"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            Menu
          </button>

          <div className="leading-tight">
            <p className="text-sm font-semibold">{title}</p>
            {subtitle && <p className="text-xs text-[rgb(var(--muted))]">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTheme}
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{
              background: "rgb(var(--primary))",
              color: "rgb(var(--primary-2))",
            }}
          >
            Theme
          </button>

          <div className="h-9 w-9 overflow-hidden rounded-xl border bg-[rgba(var(--primary-2),.08)]"
               style={{ borderColor: "rgb(var(--border))" }}
               title="Player Profile">
            <div className="grid h-full w-full place-items-center text-xs font-bold">
              P
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

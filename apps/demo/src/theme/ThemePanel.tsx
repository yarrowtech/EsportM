import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useTheme } from "./useTheme";

export function ThemePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    theme,
    update,
    canManageClubTheme,
    isSyncing,
    syncError,
    activeClubId,
  } = useTheme();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!panelRef.current || !overlayRef.current) return;

    if (open) {
      gsap.set([overlayRef.current, panelRef.current], { pointerEvents: "auto" });
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.out" }
      );
      gsap.fromTo(
        panelRef.current,
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.25, ease: "power3.out" }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          if (!overlayRef.current || !panelRef.current) return;
          gsap.set([overlayRef.current, panelRef.current], { pointerEvents: "none" });
        },
      });
      gsap.to(panelRef.current, { x: 24, opacity: 0, duration: 0.15, ease: "power2.in" });
    }
  }, [open]);

  const locked = !activeClubId || !canManageClubTheme;

  return (
    <>
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/20 opacity-0 pointer-events-none"
      />
      <div
        ref={panelRef}
        className="fixed right-3 top-[72px] z-[70] w-[92vw] max-w-[360px] rounded-2xl border bg-[rgb(var(--surface))]/90 backdrop-blur-xl shadow-xl opacity-0 pointer-events-none"
        style={{ borderColor: "rgb(var(--border))" }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Club Theme</p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Same colors for all members in the selected club.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border px-3 py-1 text-xs hover:opacity-90"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {!activeClubId ? (
              <div
                className="rounded-xl border p-3 text-xs text-[rgb(var(--muted))]"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                Join or create a club first to use shared club theme.
              </div>
            ) : !canManageClubTheme ? (
              <div
                className="rounded-xl border p-3 text-xs text-[rgb(var(--muted))]"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                Theme is controlled by your club admin.
              </div>
            ) : (
              <div
                className="rounded-xl border p-2 text-right text-[11px] font-semibold text-[rgb(var(--muted))]"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                {isSyncing ? "Saving club theme..." : "Club theme saved automatically"}
              </div>
            )}

            {syncError ? (
              <div
                className="rounded-xl border p-3 text-xs font-semibold text-rose-700"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                {syncError}
              </div>
            ) : null}

            <label className="grid gap-1">
              <span className="text-xs text-[rgb(var(--muted))]">Primary</span>
              <input
                type="color"
                value={theme.primary}
                onChange={(e) => update({ primary: e.target.value })}
                disabled={locked}
                className="h-10 w-full rounded-xl border bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "rgb(var(--border))" }}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-[rgb(var(--muted))]">Deep</span>
              <input
                type="color"
                value={theme.deep}
                onChange={(e) => update({ deep: e.target.value })}
                disabled={locked}
                className="h-10 w-full rounded-xl border bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "rgb(var(--border))" }}
              />
            </label>

            <div
              className="rounded-xl p-3 text-xs"
              style={{
                background:
                  "linear-gradient(120deg, rgba(var(--primary), .18), rgba(var(--primary-2), .10))",
                border: "1px solid rgb(var(--border))",
              }}
            >
              Tip: use your club's jersey primary + secondary colors.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

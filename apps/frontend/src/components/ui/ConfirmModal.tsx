import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label="Close confirmation modal"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={messageId}
          className="pointer-events-auto max-h-[calc(100dvh-32px)] w-[min(28rem,calc(100vw-32px))] overflow-y-auto rounded-3xl border bg-white/80 p-5 backdrop-blur-xl shadow-[0_24px_65px_rgba(0,0,0,0.32)]"
          style={{ borderColor: "rgb(var(--border) / .14)" }}
          onClick={(event) => event.stopPropagation()}
        >
          <h2 id={titleId} className="text-base font-bold text-[rgb(var(--text))]">
            {title}
          </h2>
          <p id={messageId} className="mt-2 text-sm text-[rgb(var(--muted))]">
            {message}
          </p>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border bg-white/75 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/90"
              style={{ borderColor: "rgb(var(--border) / .14)" }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-95"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

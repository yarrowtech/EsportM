import type { ButtonHTMLAttributes } from "react";

export default function NeuButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={[
        "rounded-2xl px-5 py-3 font-semibold",
        "bg-bg shadow-neu transition-all",
        "hover:-translate-y-[1px] hover:shadow-[10px_10px_18px_#c8ccd1,-10px_-10px_18px_#ffffff]",
        "active:translate-y-[1px] active:shadow-neu-inset active:scale-[0.99]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
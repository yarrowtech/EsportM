import type { InputHTMLAttributes } from "react";

export default function NeuInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full px-4 py-3 rounded-2xl bg-bg shadow-neu-inset outline-none",
        "placeholder:text-slate-400 text-slate-800",
        "focus:ring-2 focus:ring-accent/40 transition-all",
        props.className || "",
      ].join(" ")}
    />
  );
}
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";

type Props = HTMLMotionProps<"button"> & {
  active?: boolean;
};

export function Pill({ active, className = "", ...props }: Props) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "px-4 py-2 rounded-full text-sm font-medium transition",
        "border border-black/10",
        active
          ? "bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          : "bg-white/70 text-black hover:bg-white",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
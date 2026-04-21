import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  tone?: "dark" | "light";
}

export default function Card({ children, className = "", tone = "dark" }: CardProps) {
  const base =
    tone === "light"
      ? "bg-[#D9D9D9] text-divvy-dark rounded-2xl p-6 shadow-xl"
      : "bg-white/[0.04] border border-white/10 text-divvy-ink rounded-2xl p-6";
  return <div className={`${base} ${className}`}>{children}</div>;
}

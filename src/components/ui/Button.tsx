"use client";

import { ButtonHTMLAttributes } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  loading = false,
  fullWidth = true,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "touch-target flex items-center justify-center px-6 py-3 rounded-2xl font-semibold text-base transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-divvy-green via-divvy-teal to-divvy-cyan text-white shadow-lg hover:shadow-xl",
    ghost:
      "bg-white/40 text-divvy-dark hover:bg-white/60 border border-white/50",
    danger:
      "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : children}
    </button>
  );
}

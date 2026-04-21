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
    "touch-target font-pixel tracking-wide flex items-center justify-center px-6 py-3 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-divvy-green via-divvy-teal to-divvy-cyan text-divvy-dark shadow-lg hover:shadow-xl",
    ghost:
      "bg-white/5 text-divvy-ink hover:bg-white/10 border border-white/15",
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

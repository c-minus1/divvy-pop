"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  tone?: "dark" | "light";
}

export default function Input({
  label,
  error,
  className = "",
  id,
  tone = "dark",
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  const fieldBase =
    tone === "light"
      ? "bg-white text-divvy-dark placeholder:text-divvy-dark/40 border border-black/10 focus:ring-divvy-teal/60 focus:border-divvy-teal"
      : "bg-white/[0.06] text-divvy-ink placeholder:text-white/40 border border-white/15 focus:ring-divvy-teal/60 focus:border-divvy-teal";

  const labelClass =
    tone === "light"
      ? "text-divvy-dark/70"
      : "text-divvy-ink-dim";

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1 ${labelClass}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`touch-target w-full px-4 py-3 rounded-xl ${fieldBase} focus:outline-none focus:ring-2 transition-all ${error ? "border-red-400 focus:ring-red-400/50" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-divvy-dark/70 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`touch-target w-full px-4 py-3 rounded-xl border border-white/50 bg-white/70 backdrop-blur-sm text-divvy-dark placeholder:text-divvy-dark/40 focus:outline-none focus:ring-2 focus:ring-divvy-teal/50 focus:border-divvy-teal transition-all ${error ? "border-red-400 focus:ring-red-400/50" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  variant?: "sheet" | "center";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant = "sheet",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab" && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCenter = variant === "center";

  const overlayClasses = isCenter
    ? "fixed inset-0 z-50 flex items-center justify-center p-4"
    : "fixed inset-0 z-50 flex items-end sm:items-center justify-center";

  const panelClasses = isCenter
    ? "relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-[#D9D9D9] text-divvy-dark rounded-3xl p-6 pb-8 shadow-2xl animate-fade-scale-in"
    : "relative w-full sm:max-w-md bg-[#D9D9D9] text-divvy-dark rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl animate-slide-up";

  return createPortal(
    <div
      ref={overlayRef}
      className={overlayClasses}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={panelClasses}
      >
        {title && (
          <h2 className="font-pixel text-base text-divvy-dark mb-4">{title}</h2>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-divvy-dark/60 hover:bg-black/10 transition-colors"
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

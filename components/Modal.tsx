"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "primary" | "success";
  size?: "sm" | "md" | "lg";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "primary",
  size = "md",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine width based on size
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  // Determine button color based on type
  const confirmButtonClasses = {
    primary: "bg-green-400 hover:bg-green-500 text-black font-semibold",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white font-medium",
    danger: "bg-red-500 hover:bg-red-600 text-white font-medium",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`w-full ${sizeClasses[size]} bg-[#0d0d15] border border-gray-800 rounded-xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] transform scale-100 transition-transform duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-gray-300 text-sm">
          {children ? (
            children
          ) : (
            <p className="text-gray-300 font-medium">Are you sure you want to proceed?</p>
          )}
        </div>

        {/* Footer (only if onConfirm is provided) */}
        {onConfirm && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4 bg-[#0a0a0f]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/40 rounded-lg transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm rounded-lg shadow-lg shadow-black/30 transition-all ${confirmButtonClasses[type]}`}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

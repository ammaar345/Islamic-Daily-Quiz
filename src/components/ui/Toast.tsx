"use client";

import React, { useEffect, useState } from "react";
import { useToastStore } from "@/lib/toastStore";
import { motion, useReducedMotion } from "framer-motion";

export type ToastType = "default" | "success" | "error" | "info";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ id, title, description, type = "default", duration = 5000, onClose }: ToastProps) {
  const { removeToast } = useToastStore();
  const [visible, setVisible] = useState(true);
  const [exitComplete, setExitComplete] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    if (!visible) {
      const timeout = reduce ? 0 : 300; // match motion duration
      const timer = setTimeout(() => {
        setExitComplete(true);
        onClose?.();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [visible, reduce, onClose]);

  if (exitComplete) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case "success": return "bg-success/90";
      case "error": return "bg-error/90";
      case "info": return "bg-primary/90";
      default: return "bg-ink/90";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success": return "text-success";
      case "error": return "text-error";
      case "info": return "text-primary";
      default: return "text-ink";
    }
  };

  return (
    <motion.div
      key={id}
      initial={{ y: 20, opacity: 0 }}
      animate={visible ? { y: 0, opacity: 1 } : { y: -20, opacity: 0 }}
      exit={visible ? { y: -20, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
      className={`fixed bottom-4 right-4 mx-4 w-96 rounded-2xl p-4 ${getBackgroundColor()} ${getTextColor()} shadow-lg z-50 flex items-start space-x-4`}
    >
      <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border-2">
        {/* Simple icons by type */}
        {type === "success" && (
          <span className="text-success">✓</span>
        )}
        {type === "error" && (
          <span className="text-error">✕</span>
        )}
        {type === "info" && (
          <span className="text-primary">ℹ️</span>
        )}
        {!["success", "error", "info"].includes(type) && (
          <span className="text-ink">ℹ️</span>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-ink/80">{description}</p>}
      </div>
    </motion.div>
  );
}

export function useToast() {
  const { toasts, addToast, removeToast } = useToastStore();
  return { toasts, addToast, removeToast };
}
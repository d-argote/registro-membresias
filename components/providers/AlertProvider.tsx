"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

export type AlertType = "success" | "error" | "warning";

export interface AlertMessage {
  id: string;
  type: AlertType;
  title: string;
  message: string;
}

interface AlertContextProps {
  showAlert: (type: AlertType, title: string, message: string) => void;
  hideAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const showAlert = useCallback((type: AlertType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 5000);
  }, []);

  const hideAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {/* Toast Container - Bottom Right or Bottom Center */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        {alerts.map((alert) => (
          <AlertToast key={alert.id} alert={alert} onClose={() => hideAlert(alert.id)} />
        ))}
      </div>
    </AlertContext.Provider>
  );
}

function AlertToast({ alert, onClose }: { alert: AlertMessage; onClose: () => void }) {
  const [isShowing, setIsShowing] = useState(false);

  // Trigger entering animation
  useEffect(() => {
    // A small tick delay allows the DOM to render the initial translated state before applying the transform class
    requestAnimationFrame(() => setIsShowing(true));
  }, []);

  const config = {
    success: {
      icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
      border: "border-green-500/20",
      bg: "bg-surface-container-high",
    },
    error: {
      icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
      border: "border-red-500/20",
      bg: "bg-surface-container-high",
    },
    warning: {
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />,
      border: "border-yellow-500/20",
      bg: "bg-surface-container-high",
    },
  };

  const aConf = config[alert.type];

  return (
    <div
      className={`
        pointer-events-auto flex w-[350px] max-w-full rounded-xl shadow-xl shadow-black/10 border ${aConf.border} ${aConf.bg} p-4 gap-3 
        transform transition-all duration-300 ease-out will-change-transform
        ${isShowing ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
      `}
    >
      <div className="flex-shrink-0 pt-0.5">{aConf.icon}</div>
      <div className="flex-1 flex flex-col min-w-0">
        <h3 className="text-sm font-bold text-on-surface">{alert.title}</h3>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5 leading-relaxed">{alert.message}</p>
      </div>
      <button
        onClick={() => {
          setIsShowing(false);
          setTimeout(onClose, 300); // match transition duration
        }}
        className="flex-shrink-0 text-outline-variant hover:text-on-surface transition-colors p-1 -mr-2 -mt-2 self-start rounded-full hover:bg-surface-container"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

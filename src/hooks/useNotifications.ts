import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
  category: "presupuesto" | "pago" | "sistema" | "resumen";
}

export interface NotificationSettings {
  email: string;
  phone: string;
  enableEmail: boolean;
  enableSMS: boolean;
  enableInApp: boolean;
}

const defaultSettings: NotificationSettings = {
  email: "",
  phone: "",
  enableEmail: true,
  enableSMS: false,
  enableInApp: true,
};

export function useNotifications() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>(
    "cap-finanzas-notifications",
    []
  );

  const [settings, setSettings] = useLocalStorage<NotificationSettings>(
    "cap-finanzas-notification-settings",
    defaultSettings
  );

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50

      return newNotification;
    },
    [setNotifications]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [setNotifications]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [setNotifications]);

  const deleteNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [setNotifications]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [setSettings]
  );

  return {
    notifications,
    unreadCount,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
  };
}

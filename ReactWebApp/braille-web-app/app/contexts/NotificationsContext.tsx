import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type NotificationCategory = "system" | "user";
export type NotificationItem = {
  id: string;
  title: string;
  message?: string;
  category: NotificationCategory;
  createdAt: number; // epoch ms
  read: boolean;
};

type NotificationsCtx = {
  items: NotificationItem[];
  unreadCount: number;
  add: (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

const Ctx = createContext<NotificationsCtx | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem("notifications");
      if (raw) setItems(JSON.parse(raw));
    } catch {/* ignore */}
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(items));
  }, [items]);

  const add: NotificationsCtx["add"] = (n) => {
    const item: NotificationItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      createdAt: Date.now(),
      read: false,
      ...n,
    };
    setItems((prev) => [item, ...prev]);
  };

  const markRead = (id: string) => setItems((prev) => prev.map(i => i.id === id ? { ...i, read: true } : i));
  const markAllRead = () => setItems((prev) => prev.map(i => ({ ...i, read: true })));
  const clear = () => setItems([]);

  const unreadCount = useMemo(() => items.filter(i => !i.read).length, [items]);

  const value: NotificationsCtx = { items, unreadCount, add, markRead, markAllRead, clear };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
};

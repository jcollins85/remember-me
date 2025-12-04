// src/context/NotificationContext.tsx
import React, { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
}

export interface NotificationEntry extends Notification {
  id: string;
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (message: string, type?: NotificationType) => void;
  notifications: NotificationEntry[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  duration?: number; // milliseconds
}

export const NotificationProvider = ({ children, duration = 3000 }: NotificationProviderProps) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifications, setNotifications] = useLocalStorage<NotificationEntry[]>('remember-me-notifications', []);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    const entry: NotificationEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [entry, ...prev].slice(0, 25));
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }, [duration, setNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, read: true } : entry))
    );
  }, [setNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((entry) => (entry.read ? entry : { ...entry, read: true }))
    );
  }, [setNotifications]);

  return (
    <NotificationContext.Provider value={{ notification, showNotification, notifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

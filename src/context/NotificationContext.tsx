// src/context/NotificationContext.tsx
import React, { createContext, ReactNode, useContext, useState, useCallback, useRef, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationEntry {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  toasts: NotificationEntry[];
  showNotification: (message: string, type?: NotificationType) => void;
  dismissToast: (id: string) => void;
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
  const [notifications, setNotifications] = useLocalStorage<NotificationEntry[]>(
    'remember-me-notifications',
    []
  );
  const [toasts, setToasts] = useState<NotificationEntry[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    const entry: NotificationEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [entry, ...prev].slice(0, 25));
    setToasts((prev) => [...prev, entry].slice(-3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== entry.id));
    }, duration);
  }, [duration, setNotifications]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

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

  useEffect(() => {
    return () => {
      setToasts([]);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, showNotification, dismissToast, notifications, markAsRead, markAllAsRead }}>
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

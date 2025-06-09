// src/context/NotificationContext.tsx
import React, { createContext, ReactNode, useContext, useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  duration?: number; // milliseconds
}

export const NotificationProvider = ({ children, duration = 3000 }: NotificationProviderProps) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }, [duration]);

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>
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

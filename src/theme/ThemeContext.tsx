import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

// Define available theme keys
export type ThemeKey = 'light' | 'coral' | 'midnight' | 'pink' | 'emerald';

// Public theme API used by settings + theme-aware components.
interface ThemeContextProps {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

// Default values matching CSS :root[data-theme="..."] blocks
export const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

// Centralizes theme selection so CSS variables + analytics stay in sync across the whole app.
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Determine initial theme: localStorage → OS preference → default
  const getInitialTheme = (): ThemeKey => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme') as ThemeKey | null;
    if (stored && ['light', 'coral', 'midnight', 'pink', 'emerald'].includes(stored)) {
      return stored;
    }
    const mqlDark = window.matchMedia('(prefers-color-scheme: dark)');
    if (mqlDark.matches) {
      return 'midnight';
    }
    return 'light';
  };

  const [theme, setThemeState] = useState<ThemeKey>(() => getInitialTheme());
  const { trackEvent } = useAnalytics();

  const changeTheme = useCallback(
    (nextTheme: ThemeKey) => {
      if (nextTheme === theme) return;
      setThemeState(nextTheme);
      trackEvent('theme_changed', { theme: nextTheme });
    },
    [theme, trackEvent]
  );

  // Apply theme + persist whenever the state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // in case storage is unavailable
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

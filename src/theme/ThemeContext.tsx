import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define available theme keys
export type ThemeKey = 'light' | 'coral' | 'midnight' | 'pink';

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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Determine initial theme: localStorage → OS preference → default
  const getInitialTheme = (): ThemeKey => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme') as ThemeKey | null;
    if (stored && ['light', 'coral', 'midnight', 'pink'].includes(stored)) {
      return stored;
    }
    const mqlDark = window.matchMedia('(prefers-color-scheme: dark)');
    if (mqlDark.matches) {
      return 'midnight';
    }
    return 'light';
  };

  const [theme, setTheme] = useState<ThemeKey>(() => getInitialTheme());

  // Apply theme and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // in case storage is unavailable
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

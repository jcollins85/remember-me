import { useState, useEffect } from 'react';

/**
 * Custom hook to persist a list of favorite IDs (or names) in localStorage.
 * @param key The localStorage key to use.
 * @returns A tuple [favorites, setFavorites]
 */
export function useFavorites(key: string) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(favorites));
    } catch {
      // ignore write errors
    }
  }, [key, favorites]);

  return [favorites, setFavorites] as const;
}

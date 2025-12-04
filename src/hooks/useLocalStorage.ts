// src/hooks/useLocalStorage.ts
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type StorageAction = 'read' | 'write';

interface Options {
  onError?: (action: StorageAction, error: unknown) => void;
}

/**
 * A hook that synchronizes state with localStorage.
 *
 * @param key localStorage key
 * @param initialValue default value or lazy initializer
 */
export default function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: Options = {}
): [T, Dispatch<SetStateAction<T>>] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
      // If initialValue is a function, call it
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: Error reading key "${key}":`, error);
      options.onError?.('read', error);
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore = JSON.stringify(storedValue);
      window.localStorage.setItem(key, valueToStore);
    } catch (error) {
      console.warn(`useLocalStorage: Error setting key "${key}":`, error);
      options.onError?.('write', error);
    }
  }, [key, storedValue, options]);

  return [storedValue, setStoredValue];
}

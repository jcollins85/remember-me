// src/components/header/useSearchSort.ts
import { useState } from 'react';

/**
 * Manages search query, active tag filters, and person sort order.
 * @param initialSearch Optional initial search string.
 * @param initialTags Optional initial list of active tag IDs.
 * @param initialSort Optional initial sort key (e.g., 'name-asc').
 */
export function useSearchSort(
  initialSearch: string = '',
  initialTags: string[] = [],
  initialSort: string = 'name-asc'
) {
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [activeTags, setActiveTags] = useState<string[]>(initialTags);
  const [personSort, setPersonSort] = useState<string>(initialSort);

  return { searchQuery, setSearchQuery, activeTags, setActiveTags, personSort, setPersonSort };
}

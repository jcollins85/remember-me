// src/components/header/useSearchSort.ts
import { useState } from 'react';
import type { SortKey } from '../../utils/sortHelpers';

/**
 * Manages search query, active tag filters, and person sort order.
 * @param initialSearch Optional initial search string.
 * @param initialTags Optional initial list of active tag IDs.
 * @param initialSort Optional initial sort key (e.g., 'name-asc').
 */

type Direction = 'asc' | 'desc';
type SortString = `${SortKey}-${Direction}`;

export function useSearchSort(
  initialSearch = '',
  initialTags: string[] = [],
  initialSort: SortString = 'updatedAt-desc'
) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeTags, setActiveTags]   = useState(initialTags);
  const [personSort, setPersonSort]   = useState<SortString>(initialSort);

  return { searchQuery, setSearchQuery, activeTags, setActiveTags, personSort, setPersonSort };
}

import { useState, useEffect, useRef } from 'react';
import type { Tag } from '../types';

interface UseTagInputArgs {
  initialTags: string[];           // e.g. names of tags on edit
  allTags: Tag[];                  // global Tag[] for suggestions
  maxCount?: number;               // default 15
  maxLength?: number;              // default 25
}

export function useTagInput({
  initialTags,
  allTags,
  maxCount = 15,
  maxLength = 25,
}: UseTagInputArgs) {
  const [tags, setTags] = useState<string[]>(() => [...initialTags]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [liveMsg, setLiveMsg] = useState<string>('');
  const timeoutRef = useRef<number | null>(null);

  // Sanitize & validate single tag
  const sanitize = (raw: string) =>
    raw.trim().toLowerCase().replace(/[^a-z0-9-\s]/g, '').replace(/\s{2,}/g, ' ');

  const commit = (raw: string) => {
    const name = sanitize(raw);
    if (!name) return;
    if (name.length > maxLength) {
      setError(`Tag must be ≤${maxLength} chars`);
      return;
    }
    if (tags.includes(name)) {
      setLiveMsg(`“${name}” already added`);
      return;
    }
    if (tags.length >= maxCount) {
      setError(`Max ${maxCount} tags reached`);
      return;
    }
    setTags((prev) => [...prev, name]);    
    setLiveMsg(`Added “${name}”`);
  };

  // Debounce suggestions
  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      const q = input.trim().toLowerCase();
      const usage = allTags
        .filter(t => t.name.includes(q))
        .slice(0, 5);
      setSuggestions(q ? usage : allTags.slice(0, 5));
      setHighlightedIndex(null);
    }, 200);
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current) };
  }, [input, allTags]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.includes(',')) {
      v.split(',').slice(0, -1).forEach(commit);
      setInput(v.split(',').slice(-1)[0]);
    } else {
      setInput(v);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = suggestions.length;
    if (e.key === 'Enter') { e.preventDefault(); commit(input); setInput(''); }
    if (e.key === 'ArrowDown' && count) {
      e.preventDefault();
      setHighlightedIndex(idx => idx === null ? 0 : (idx + 1) % count);
    }
    if (e.key === 'ArrowUp' && count) {
      e.preventDefault();
      setHighlightedIndex(idx => idx === null ? count - 1 : (idx - 1 + count) % count);
    }
    if (e.key === 'Escape') { setInput(''); setSuggestions([]); }
  };

  const onInputBlur = () => {
    setSuggestions([]);
    setHighlightedIndex(null);
  };

  const remove = (name: string) => {
    setTags(prev => prev.filter(t => t !== name));
  };

  const resetInput = () => {
    setInput("");
    setSuggestions([]);
    setHighlightedIndex(null);
  };  

  return {
    tags,
    input,
    suggestions,
    highlightedIndex,
    error,
    liveMsg,
    handlers: { onInputChange, onInputKeyDown, onInputBlur, commit, remove, resetInput },
  };
}

// src/context/TagContext.tsx
import React, { createContext, ReactNode, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { sampleTags } from '../data';
import { Tag } from '../types';

interface TagContextType {
  tags: Tag[];
  createTag: (name: string) => Tag;
  getTagNameById: (id: string) => string;
  getTagIdByName: (name: string) => string | null;
}

const TagContext = createContext<TagContextType | undefined>(undefined);

interface TagProviderProps {
  children: ReactNode;
}

export const TagProvider = ({ children }: TagProviderProps) => {
  // Persist tags in localStorage
  const [tags, setTags] = useLocalStorage<Tag[]>('tags', sampleTags);

  // Get a tag name by its id, fallback to empty string
  const getTagNameById = (id: string): string => {
    const tag = tags.find((t) => t.id === id);
    return tag ? tag.name : '';
  };

  // Get a tag id by its name (case-insensitive)
  const getTagIdByName = (name: string): string | null => {
    const normalized = name.trim().toLowerCase();
    const tag = tags.find((t) => t.name.toLowerCase() === normalized);
    return tag ? tag.id : null;
  };

  // Create a new tag or return existing one
  const createTag = (name: string): Tag => {
    const normalized = name.trim().toLowerCase();
    const existing = tags.find((t) => t.name.toLowerCase() === normalized);
    if (existing) return existing;

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: normalized,
      count: 0,
      lastUsed: Date.now(),
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  };

  return (
    <TagContext.Provider value={{ tags, createTag, getTagNameById, getTagIdByName }}>
      {children}
    </TagContext.Provider>
  );
};

export const useTags = (): TagContextType => {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTags must be used within a TagProvider');
  }
  return context;
};

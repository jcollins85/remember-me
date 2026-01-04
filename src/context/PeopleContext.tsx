// src/context/PeopleContext.tsx
import React, { createContext, ReactNode, useContext, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Person } from '../types';
import { samplePeople } from '../data';
import { useNotification } from './NotificationContext';

interface PeopleContextType {
  people: Person[];
  addPerson: (person: Person) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
  replacePeople: (people: Person[]) => void;
}

const PeopleContext = createContext<PeopleContextType | undefined>(undefined);

interface PeopleProviderProps {
  children: ReactNode;
}

export const PeopleProvider = ({ children }: PeopleProviderProps) => {
  const { showNotification } = useNotification();
  const handleStorageError = useCallback(
    (action: 'read' | 'write') => {
      const verb = action === 'read' ? 'loading' : 'saving';
      showNotification(`Problem ${verb} people data. Changes may not persist.`, 'error');
    },
    [showNotification]
  );
  // Persist people array in localStorage, seeded from sample data
  const [people, setPeople] = useLocalStorage<Person[]>(
    'people',
    samplePeople,
    { onError: handleStorageError }
  );

  const addPerson = (person: Person) => {
    setPeople((prev) => [person, ...prev]);
  };

  const updatePerson = (person: Person) => {
    setPeople((prev) => prev.map((p) => (p.id === person.id ? person : p)));
  };

  const deletePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const replacePeople = (next: Person[]) => {
    setPeople(() => [...next]);
  };

  return (
    <PeopleContext.Provider
      value={{ people, addPerson, updatePerson, deletePerson, replacePeople }}
    >
      {children}
    </PeopleContext.Provider>
  );
};

export const usePeople = (): PeopleContextType => {
  const context = useContext(PeopleContext);
  if (!context) {
    throw new Error('usePeople must be used within a PeopleProvider');
  }
  return context;
};

// src/context/PeopleContext.tsx
import React, { createContext, ReactNode, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Person } from '../types';
import { samplePeople } from '../data';

interface PeopleContextType {
  people: Person[];
  addPerson: (person: Person) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
}

const PeopleContext = createContext<PeopleContextType | undefined>(undefined);

interface PeopleProviderProps {
  children: ReactNode;
}

export const PeopleProvider = ({ children }: PeopleProviderProps) => {
  // Persist people array in localStorage, seeded from sample data
  const [people, setPeople] = useLocalStorage<Person[]>('people', samplePeople);

  const addPerson = (person: Person) => {
    setPeople((prev) => [person, ...prev]);
  };

  const updatePerson = (person: Person) => {
    setPeople((prev) => prev.map((p) => (p.id === person.id ? person : p)));
  };

  const deletePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <PeopleContext.Provider
      value={{ people, addPerson, updatePerson, deletePerson }}
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

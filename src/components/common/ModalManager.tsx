import React from 'react';
import { AnimatePresence } from 'framer-motion';
import PersonModal from '../people/PersonModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import type { Person, Tag } from '../../types';
import { useAnalytics } from '../../context/AnalyticsContext';

interface Props {
  // Add Person Modal
  showAdd: boolean;
  onAddCancel: () => void;
  onAdd: (person: Person) => void;
  tags: Tag[];
  people: Person[];
  getTagIdByName: (name: string) => string | null;
  getTagNameById: (id: string) => string;
  createTag: (name: string) => Tag;

  // Edit Person Modal
  editingPerson: Person | null;
  onEditCancel: () => void;
  onEdit: (person: Person) => void;

  // Delete Confirm
  personToDelete: Person | null;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string) => void;
}

export default function ModalManager({
  showAdd,
  onAddCancel,
  onAdd,
  tags,
  people,
  getTagIdByName,
  getTagNameById,
  createTag,
  editingPerson,
  onEditCancel,
  onEdit,
  personToDelete,
  onDeleteCancel,
  onDeleteConfirm,
}: Props) {
  const { trackEvent } = useAnalytics();
  const handleAddSubmit = async (person: Person) => {
    await trackEvent("person_added", { venueId: person.venueId, tags: person.tags?.length ?? 0, favorite: !!person.favorite });
    onAdd(person);
  };
  const handleEditSubmit = async (person: Person) => {
    await trackEvent("person_updated", { id: person.id, venueId: person.venueId, favorite: !!person.favorite });
    onEdit(person);
  };
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {showAdd && (
          <PersonModal
            key="add-person"
            mode="add"
            tags={tags}
            people={people}
            getTagIdByName={getTagIdByName}
            getTagNameById={getTagNameById}
            createTag={createTag}
            onSubmit={handleAddSubmit}
            onCancel={onAddCancel}
          />
        )}

        {editingPerson && (
          <PersonModal
            key="edit-person"
            mode="edit"
            person={editingPerson}
            tags={tags}
            people={people}
            getTagIdByName={getTagIdByName}
            getTagNameById={getTagNameById}
            createTag={createTag}
            onSubmit={handleEditSubmit}
            onCancel={onEditCancel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {personToDelete && (
          <DeleteConfirmModal
            key="delete-person"
            name={personToDelete.name}
            onCancel={onDeleteCancel}
            onConfirm={() => onDeleteConfirm(personToDelete.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

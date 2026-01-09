import React from 'react';
import { AnimatePresence } from 'framer-motion';
import PersonModal from '../people/PersonModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import type { Person, Tag } from '../../types';

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

// Centralizes modal orchestration so we only deal with framer-motion stacks in one place.
// Keeps add/edit/delete mutually exclusive and preserves exit animations even when state flips fast.
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
            onSubmit={onAdd}
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
            onSubmit={onEdit}
            onCancel={onEditCancel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {/* Delete lives in its own layer so it can slide independently of add/edit */}
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

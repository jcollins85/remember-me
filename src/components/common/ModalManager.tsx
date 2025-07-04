import React from 'react';
import AddPersonModal from '../people/AddPersonModal';
import EditPersonModal from '../people/EditPersonModal';
import DeleteConfirmModal from '../people/DeleteConfirmModal';
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
      {showAdd && (
        <AddPersonModal
          tags={tags}
          people={people}
          getTagIdByName={getTagIdByName}
          getTagNameById={getTagNameById}
          createTag={createTag}
          onAdd={(p) => onAdd(p)}
          onCancel={onAddCancel}
        />
      )}

      {editingPerson && (
        <EditPersonModal
          tags={tags}
          people={people}
          getTagIdByName={getTagIdByName}
          getTagNameById={getTagNameById}
          createTag={createTag}
          person={editingPerson}
          onSave={(p) => onEdit(p)}
          onCancel={onEditCancel}
        />
      )}

      {personToDelete && (
        <DeleteConfirmModal
          name={personToDelete.name}
          onCancel={onDeleteCancel}
          onConfirm={() => onDeleteConfirm(personToDelete.id)}
        />
      )}
    </>
  );
}

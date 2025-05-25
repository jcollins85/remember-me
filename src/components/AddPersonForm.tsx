import { useState } from "react";
import { Person } from "../types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  onAdd: (person: Person) => void;
}

export default function AddPersonForm({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const newPerson: Person = {
        id: uuidv4(),
        name,
        position,
        venue,
        description,
        tags: tagsInput
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag !== "")
          .sort(),
        dateMet: new Date().toISOString(),
    };
      
    onAdd(newPerson);
    setName("");
    setVenue("");
    setDescription("");
    setTagsInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 max-w-xl mx-auto space-y-3">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
        <input
        type="text"
        placeholder="Position / Role"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="w-full p-2 border rounded"
        />
      <input
        type="text"
        placeholder="Venue (optional)"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded"
        rows={3}
      />
        <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        className="w-full p-2 border rounded"
        />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Add Person
      </button>
    </form>
  );
}

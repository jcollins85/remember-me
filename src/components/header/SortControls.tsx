import React from "react";
import type { SortKey, VenueSortKey } from "../../utils/sortHelpers";

type Direction = "asc" | "desc";
type PersonSortString = `${SortKey}-${Direction}`;

interface Props {
  variant: "venue" | "people";
  venueSortKey: VenueSortKey;
  venueSortDir: Direction;
  setVenueSortKey: (key: VenueSortKey) => void;
  setVenueSortDir: (dir: Direction) => void;
  personSort: PersonSortString;
  setPersonSort: (val: PersonSortString) => void;
  onClose?: () => void;
}

const venuePresetOptions: Array<{ key: VenueSortKey; dir: Direction; label: string }> = [
  { key: "name", dir: "asc", label: "Name A→Z" },
  { key: "name", dir: "desc", label: "Name Z→A" },
  { key: "recentVisit", dir: "desc", label: "Recent ↓" },
  { key: "recentVisit", dir: "asc", label: "Recent ↑" },
  { key: "knownCount", dir: "desc", label: "Most Known" },
  { key: "knownCount", dir: "asc", label: "Least Known" },
];

const personPresetOptions: Array<{ value: PersonSortString; label: string }> = [
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
  { value: "dateMet-desc", label: "Date Newest" },
  { value: "dateMet-asc", label: "Date Oldest" },
  { value: "updatedAt-desc", label: "Updated Newest" },
  { value: "updatedAt-asc", label: "Updated Oldest" },
];

export default function SortControls({
  variant,
  venueSortKey,
  venueSortDir,
  setVenueSortKey,
  setVenueSortDir,
  personSort,
  setPersonSort,
  onClose,
}: Props) {
  const venueActiveToken = `${venueSortKey}-${venueSortDir}`;

  const chips =
    variant === "venue"
      ? venuePresetOptions.map(({ key, dir, label }) => {
          const token = `${key}-${dir}`;
          const isActive = token === venueActiveToken;
          return (
            <button
              key={token}
              onClick={() => {
                setVenueSortKey(key);
                setVenueSortDir(dir);
                onClose?.();
              }}
              className={`px-3 py-1 rounded-full text-[12px] border transition ${
                isActive
                  ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-level1"
                  : "bg-white/70 text-[var(--color-text-secondary)] border-white/70 hover:bg-white"
              }`}
            >
              {label}
            </button>
          );
        })
      : personPresetOptions.map(({ value, label }) => {
          const isActive = value === personSort;
          return (
            <button
              key={value}
              onClick={() => {
                setPersonSort(value);
                onClose?.();
              }}
              className={`px-3 py-1 rounded-full text-[12px] border transition ${
                isActive
                  ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-level1"
                  : "bg-white/70 text-[var(--color-text-secondary)] border-white/70 hover:bg-white"
              }`}
            >
              {label}
            </button>
          );
        });

  return (
    <div className="flex flex-wrap gap-2 text-[13px] border border-white/50 rounded-2xl px-3 py-2 bg-white/70">
      {chips}
    </div>
  );
}

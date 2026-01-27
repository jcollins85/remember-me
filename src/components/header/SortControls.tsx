import React from "react";
import { MapPin, Users, Check } from "lucide-react";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";
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
}

const venuePresetOptions: Array<{ key: VenueSortKey; dir: Direction; label: string; description: string }> = [
  { key: "name", dir: "asc", label: "Name A→Z", description: "Alphabetical ascending" },
  { key: "name", dir: "desc", label: "Name Z→A", description: "Alphabetical descending" },
  { key: "recentVisit", dir: "desc", label: "Recent visits first", description: "Newest activity at the top" },
  { key: "recentVisit", dir: "asc", label: "Oldest visits first", description: "Revisit older spots" },
  { key: "knownCount", dir: "desc", label: "Most known people", description: "Heaviest activity first" },
  { key: "knownCount", dir: "asc", label: "Least known people", description: "Discover quieter venues" },
];

const personPresetOptions: Array<{ value: PersonSortString; label: string; description: string }> = [
  { value: "name-asc", label: "Name A→Z", description: "Alphabetical ascending" },
  { value: "name-desc", label: "Name Z→A", description: "Alphabetical descending" },
  { value: "dateMet-desc", label: "Newest meetings", description: "People you met most recently" },
  { value: "dateMet-asc", label: "Oldest meetings", description: "Older connections first" },
  { value: "updatedAt-desc", label: "Recently updated", description: "Latest edits to profiles" },
  { value: "updatedAt-asc", label: "Oldest updates", description: "See older notes again" },
];

export default function SortControls({
  variant,
  venueSortKey,
  venueSortDir,
  setVenueSortKey,
  setVenueSortDir,
  personSort,
  setPersonSort,
}: Props) {
  const venueActiveToken = `${venueSortKey}-${venueSortDir}`;
  const isVenue = variant === "venue";

  const options = isVenue
    ? venuePresetOptions.map(({ key, dir, label, description }) => {
        const token = `${key}-${dir}`;
        const active = token === venueActiveToken;
        return {
          key: token,
          label,
          description,
          active,
          onSelect: async () => {
            await triggerImpact(active ? ImpactStyle.Light : ImpactStyle.Medium);
            setVenueSortKey(key);
            setVenueSortDir(dir);
            return undefined;
          },
        };
      })
    : personPresetOptions.map(({ value, label, description }) => {
        const active = value === personSort;
        return {
          key: value,
          label,
          description,
          active,
          onSelect: async () => {
            await triggerImpact(active ? ImpactStyle.Light : ImpactStyle.Medium);
            setPersonSort(value);
            return undefined;
          },
        };
      });

  const label = isVenue ? "Sort venues" : "Sort people";
  const HelperIcon = isVenue ? MapPin : Users;

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-muted)] text-[var(--color-accent)] flex items-center justify-center shadow-[0_8px_18px_rgba(15,23,42,0.15)]">
          <HelperIcon size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
          <p className="text-sm text-[var(--color-text-secondary)]/90">Choose how {isVenue ? "venues" : "people"} are ordered.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--color-card)]/95 px-3 py-2.5 shadow-level1/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
          {options.map(({ key, label: optionLabel, description, active, onSelect }) => (
            <button
              key={key}
              onClick={onSelect}
              className={`w-full text-left px-3 py-2.5 rounded-2xl border transition duration-200 flex items-start justify-between gap-2 ${
                active
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-muted)] text-[var(--color-accent)]"
                  : "border-[color:var(--color-card-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/90"
              }`}
            >
              <div>
                <p className="text-[13px] font-semibold">{optionLabel}</p>
                <p className={`text-[11px] ${active ? "text-[var(--color-accent)]/90" : "text-[var(--color-text-secondary)]"}`}>
                  {description}
                </p>
              </div>
              {active && (
                <span className="inline-flex h-5 w-5 items-center justify-center self-center rounded-full bg-[var(--color-card)] text-[var(--color-accent)] shadow-[0_4px_10px_rgba(15,23,42,0.12)]">
                  <Check size={12} className="translate-y-[0.5px]" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

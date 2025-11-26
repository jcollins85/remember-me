import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Sparkles, Heart } from 'lucide-react';

export type Segment<T extends string> = { key: T; label: string };

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: Dispatch<SetStateAction<T>>;
  className?: string;
}

function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex bg-white/80 backdrop-blur-lg border border-white/70 rounded-full shadow-level1 overflow-hidden ${className}`}
    >
      {segments.map(seg => {
        const isSelected = seg.key === value;
        const icon =
          seg.key === 'all' ? <Sparkles size={14} className="mr-1.5" /> : <Heart size={14} className="mr-1.5" />;

        return (
          <button
            key={seg.key}
            onClick={() => onChange(seg.key)}
            className={`flex items-center px-4 py-1.5 text-sm font-medium whitespace-nowrap transition ${
              isSelected
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-primary)] hover:bg-white/40'
            }`}
          >
            {icon}
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;

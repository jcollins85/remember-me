import React from 'react';
import type { Dispatch, SetStateAction } from 'react';

// Generic segment type
export type Segment<T extends string> = { key: T; label: string };

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: Dispatch<SetStateAction<T>>;
  className?: string;
}

/**
 * Glassmorphic segmented control for toggling between views
 */
function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={
        `inline-flex bg-surface backdrop-blur-sm border border-neutral-200 rounded-full shadow-level1 overflow-hidden ${className}`
      }
    >
      {segments.map(seg => {
        const isSelected = seg.key === value;
        return (
          <button
            key={seg.key}
            onClick={() => onChange(seg.key)}
            className={
              `px-4 py-1 text-sm font-medium whitespace-nowrap focus:outline-none transition-colors duration-200 ${
                isSelected
                  ? 'bg-accent text-white'
                  : 'text-textPrimary hover:bg-white/30'
              }`
            }
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
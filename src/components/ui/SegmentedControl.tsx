import React, { memo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';

export type Segment<T extends string> = { key: T; label: string };

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: Dispatch<SetStateAction<T>>;
  className?: string;
}

function SegmentedControlComponent<T extends string>({
  segments,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <LayoutGroup>
      <div
        className={`relative inline-flex rounded-full bg-[var(--color-card)]/90 backdrop-blur-lg overflow-hidden shadow-[0_8px_18px_rgba(15,23,42,0.07)] ${className}`}
      >
        {segments.map(seg => {
          const isSelected = seg.key === value;
          const icon =
            seg.key === 'all' ? <Sparkles size={14} className="mr-1.5" /> : <Heart size={14} className="mr-1.5" />;

          return (
            <button
              key={seg.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(seg.key)}
              className={`relative isolate flex items-center gap-1.5 px-[11px] min-h-[32px] text-[0.82rem] font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/25 ${
                isSelected
                  ? 'text-white drop-shadow-[0_2px_8px_rgba(15,23,42,0.25)] opacity-100'
                  : 'text-[var(--color-text-secondary)] opacity-40 hover:opacity-100 hover:text-[var(--color-text-primary)]'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="segmentHighlight"
                  className="absolute inset-0 rounded-full shadow-[0_10px_24px_rgba(15,23,42,0.18)] border"
                  style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.35 }}
                />
              )}
              <motion.span
                className="relative flex items-center"
                animate={isSelected ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {icon}
                {seg.label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

const SegmentedControl = memo(SegmentedControlComponent) as typeof SegmentedControlComponent;

export default SegmentedControl;

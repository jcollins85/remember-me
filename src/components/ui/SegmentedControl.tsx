import React, { memo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';
import { triggerImpact, ImpactStyle } from '../../utils/haptics';

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
        className={`relative inline-flex rounded-full bg-[var(--color-card)]/90 backdrop-blur-lg overflow-hidden shadow-[0_8px_18px_rgba(15,23,42,0.07)] border border-[var(--color-card-border)]/70 p-0.5 ${className}`}
        // Mask prevents iOS from showing a square glow when the highlight has a shadow.
        style={{ WebkitMaskImage: 'radial-gradient(circle, white 99%, transparent 100%)' }}
      >
        {segments.map(seg => {
          const isSelected = seg.key === value;
          const icon =
            seg.key === 'all' ? <Sparkles size={14} className="mr-1.5" /> : <Heart size={14} className="mr-1.5" />;

          const handleSelect = async () => {
            if (isSelected) return;
            await triggerImpact(ImpactStyle.Medium);
            onChange(seg.key);
          };

          return (
            <button
              key={seg.key}
              type="button"
              aria-pressed={isSelected}
              onClick={handleSelect}
              className={`relative isolate flex items-center gap-1.5 px-[11px] min-h-[30px] text-[0.82rem] font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/25 ${
                isSelected
                  ? 'text-white drop-shadow-[0_2px_8px_rgba(15,23,42,0.25)] opacity-100'
                  : 'text-[var(--color-text-secondary)] opacity-70 hover:opacity-100 hover:text-[var(--color-text-primary)]'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="segmentHighlight"
                  className="absolute inset-[1px] rounded-full border"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                    boxShadow: '0 10px 24px rgba(15,23,42,0.18)',
                  }}
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

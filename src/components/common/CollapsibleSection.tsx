import React, { ReactNode, useState } from 'react';

interface Props {
  /** Title or header text/content for the section */
  title: ReactNode;
  /** Whether the section is open by default */
  defaultOpen?: boolean;
  /** Content to display inside the section when open */
  children: ReactNode;
}

/**
 * A collapsible panel component with a header toggle.
 */
export default function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center justify-between w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        <span className="font-semibold text-lg">{title}</span>
        <span className="text-xl">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && <div className="mt-2 space-y-4">{children}</div>}
    </section>
  );
}

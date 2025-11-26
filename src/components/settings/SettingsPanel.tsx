import React, { useContext } from "react";
import { ThemeContext, ThemeKey } from "../../theme/ThemeContext";
import { SunMedium, Palette, Moon, Heart } from "lucide-react";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const themes: Array<{
  key: ThemeKey;
  name: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: "light",
    name: "Light",
    description: "Soft gradient background, bright surfaces.",
    icon: <SunMedium size={16} />,
  },
  {
    key: "coral",
    name: "Coral",
    description: "Warm tones inspired by sunsets.",
    icon: <Palette size={16} />,
  },
  {
    key: "pink",
    name: "Pink Pop",
    description: "Playful blush palette with vibrant accents.",
    icon: <Heart size={16} />,
  },
  {
    key: "midnight",
    name: "Midnight",
    description: "Moody dark mode for late-night sessions.",
    icon: <Moon size={16} />,
  },
];

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { theme, setTheme } = useContext(ThemeContext);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
              Personalize
            </p>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Settings
            </h3>
          </div>
          <button
            className="h-8 w-8 rounded-full border border-white/70 text-[var(--color-text-secondary)] hover:bg-white"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Theme
          </p>
          <div className="grid gap-3">
            {themes.map((item) => {
              const isActive = item.key === theme;
              return (
                <button
                  key={item.key}
                  onClick={() => setTheme(item.key)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border transition flex items-start gap-3 ${
                    isActive
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                      : "border-white/70 bg-white/70 text-[var(--color-text-primary)] hover:bg-white"
                  }`}
                >
                  <div className="mt-0.5">{item.icon}</div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

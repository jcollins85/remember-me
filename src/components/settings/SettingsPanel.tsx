import React, { useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeContext, ThemeKey } from "../../theme/ThemeContext";
import { SunMedium, Palette, Moon, Heart, Download, Upload, Lock } from "lucide-react";
import { useDataBackup } from "../../hooks/useDataBackup";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  favoriteVenues: string[];
  setFavoriteVenues: React.Dispatch<React.SetStateAction<string[]>>;
  onResetData: () => void;
  onClearAchievements: () => void;
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

export default function SettingsPanel({
  open,
  onClose,
  favoriteVenues,
  setFavoriteVenues,
  onResetData,
  onClearAchievements,
}: SettingsPanelProps) {
  const { theme, setTheme } = useContext(ThemeContext);
  const { exportBackup, importBackupFromFile } = useDataBackup(favoriteVenues, setFavoriteVenues);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    setIsExporting(true);
    try {
      exportBackup();
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      await importBackupFromFile(file);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-panel w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-3 right-3 h-9 w-9 rounded-full border border-white/70 text-[var(--color-text-secondary)] hover:bg-white flex items-center justify-center"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              aria-label="Close settings"
            >
              ×
            </button>

            <div
              className="overflow-y-auto px-6 pb-6 pt-6 space-y-5"
              style={{ scrollbarGutter: "stable" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Personalize</p>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Settings</h3>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Theme</p>
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
                          <p className="text-xs text-[var(--color-text-secondary)]">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                      Data Backup
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
                        Premium
                      </span>
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Export or import all venues, people, and tags when you switch devices.
                    </p>
                  </div>
                  <Lock size={16} className="text-[var(--color-accent)]" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white disabled:opacity-60"
                  >
                    <Download size={16} />
                    {isExporting ? "Exporting…" : "Export JSON"}
                  </button>
                  <button
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-accent)] text-[var(--color-accent)] px-4 py-3 text-sm font-semibold hover:bg-[var(--color-accent-muted)] disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {isImporting ? "Importing…" : "Import JSON"}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Data Tools</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Restore the app to its sample dataset or clear achievement progress for testing.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={onResetData}
                    className="px-4 py-3 rounded-2xl border border-white/80 bg-white/70 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white transition"
                  >
                    Reset sample data
                  </button>
                  <button
                    onClick={onClearAchievements}
                    className="px-4 py-3 rounded-2xl border border-[var(--color-accent)] text-[var(--color-accent)] text-sm font-semibold hover:bg-[var(--color-accent-muted)] transition"
                  >
                    Clear achievements
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

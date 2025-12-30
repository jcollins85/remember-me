import React, { useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeContext, ThemeKey } from "../../theme/ThemeContext";
import { SunMedium, Palette, Moon, Heart, Download, Upload, Lock, X, Palette as PaletteIcon, CloudUpload, Wrench, Settings } from "lucide-react";
import { useDataBackup } from "../../hooks/useDataBackup";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0';
interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  favoriteVenues: string[];
  setFavoriteVenues: React.Dispatch<React.SetStateAction<string[]>>;
  onResetData: () => void;
  onResetApp: () => void;
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

// SettingsPanel exposes theme, backup, and developer utilities inside
// a single sheet so users can tweak global behavior without leaving home.
export default function SettingsPanel({
  open,
  onClose,
  favoriteVenues,
  setFavoriteVenues,
  onResetData,
  onResetApp,
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
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 16px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            paddingLeft: "calc(env(safe-area-inset-left) + 16px)",
            paddingRight: "calc(env(safe-area-inset-right) + 16px)",
          }}
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
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-[var(--color-card)] text-[var(--color-text-primary)] border border-[var(--color-card-border)] shadow-[0_8px_18px_rgba(15,23,42,0.15)] hover:bg-[var(--color-card)]/90 flex items-center justify-center"
              onClick={(event) => {
                event.stopPropagation();
                triggerImpact(ImpactStyle.Light);
                onClose();
              }}
              aria-label="Close settings"
            >
              <X size={16} />
            </button>

            <div className="overflow-y-auto px-6 pb-6 pt-6 space-y-5" style={{ scrollbarGutter: "stable" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[var(--color-accent-muted)] text-[var(--color-accent)] flex items-center justify-center shadow-level1">
                  <Settings size={18} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-secondary)]">Personalize</p>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Settings</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">Tune the theme, data tools, and notifications.</p>
                </div>
              </div>
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <PaletteIcon size={16} className="text-[var(--color-accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Theme</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Pick the palette that suits your vibe.</p>
                  </div>
                </div>
                <div className="grid gap-3 mt-1.5">
                  {themes.map((item) => {
                    const isActive = item.key === theme;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setTheme(item.key)}
                        className={`relative overflow-hidden w-full text-left px-4 py-3 rounded-2xl border transition flex items-start gap-3 ${
                          isActive
                            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-muted)] text-[var(--color-accent)] shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
                            : "border-[color:var(--color-card-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/90"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-r from-white/50 via-white/10 to-transparent"
                            initial={{ opacity: 0, x: -80 }}
                            animate={{ opacity: [0, 0.7, 0], x: [-80, 80] }}
                            transition={{ duration: 0.6 }}
                          />
                        )}
                        <motion.div animate={isActive ? { rotate: [0, -8, 0], scale: [1, 1.1, 1] } : { rotate: 0, scale: 1 }} transition={{ duration: 0.35 }} className="mt-0.5">{item.icon}</motion.div>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section
                className="space-y-2 border-t border-transparent pt-4"
                style={{ borderColor: "color-mix(in srgb, var(--color-accent) 60%, transparent)" }}
              >
                <div className="flex items-center gap-2">
                  <CloudUpload size={16} className="text-[var(--color-accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Data backup</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Export or import all venues, people, and tags when you switch devices.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 mt-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
                        Premium
                      </span>
                    </div>
                    <Lock size={16} className="text-[var(--color-accent)]" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={async () => {
                        await triggerImpact(ImpactStyle.Light);
                        handleExport();
                      }}
                      disabled={isExporting}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--color-card-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/90 disabled:opacity-60"
                    >
                      <Download size={16} />
                      {isExporting ? "Exporting…" : "Export JSON"}
                    </button>
                    <button
                      onClick={async () => {
                        await triggerImpact(ImpactStyle.Light);
                        handleImportClick();
                      }}
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
              </section>

              <section className="space-y-2 border-t border-[var(--color-accent)]/60 pt-4">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-[var(--color-accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Data tools</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Quickly restore sample data or clear achievements.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-[var(--color-card)]/95 space-y-3 shadow-level1/40 mt-1.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={async () => {
                        await triggerImpact(ImpactStyle.Light);
                        onResetData();
                      }}
                      className="px-4 py-3 rounded-2xl border border-[color:var(--color-card-border)] bg-[var(--color-card)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/90 transition"
                    >
                      Reset sample data
                    </button>
                    <button
                      onClick={async () => {
                        await triggerImpact(ImpactStyle.Light);
                        onClearAchievements();
                      }}
                      className="px-4 py-3 rounded-2xl border border-[var(--color-accent)] text-[var(--color-accent)] text-sm font-semibold hover:bg-[var(--color-accent-muted)] transition"
                    >
                      Clear achievements
                    </button>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        await triggerImpact(ImpactStyle.Heavy);
                        onResetApp();
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-red-200/60 bg-red-500/10 text-sm font-semibold text-red-500 hover:bg-red-500/15 transition"
                    >
                      Reset app (blank state)
                    </button>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Removes all venues, people, favourites, tags, and achievements to mimic a first-time install.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2 border-t border-white/40 pt-4 text-[var(--color-text-secondary)]">
                <p className="text-[11px] uppercase tracking-wide">About</p>
                <div className="rounded-2xl bg-[var(--color-card)]/95 text-xs space-y-1 shadow-level1/40 mt-1.5">
                  <p>Version v{APP_VERSION} · Made by Era One</p>
                  <div className="flex gap-4 text-[var(--color-text-secondary)]">
                    <button className="underline-offset-2 hover:underline" type="button">
                      Privacy
                    </button>
                    <button className="underline-offset-2 hover:underline" type="button">
                      Terms
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

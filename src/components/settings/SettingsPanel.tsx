import React, { useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeContext, ThemeKey } from "../../theme/ThemeContext";
import { SunMedium, Palette, Moon, Heart, Download, Upload, Lock, X, Palette as PaletteIcon, CloudUpload, Wrench, Settings, Leaf, Waves, MapPin } from "lucide-react";
import { useDataBackup } from "../../hooks/useDataBackup";
import { triggerImpact, ImpactStyle, isHapticsEnabled, setHapticsEnabled as persistHapticsPreference } from "../../utils/haptics";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0';
interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  favoriteVenues: string[];
  setFavoriteVenues: React.Dispatch<React.SetStateAction<string[]>>;
  onResetData: () => void;
  onResetApp: () => void;
  onClearAchievements: () => void;
  proximityEnabled: boolean;
  onToggleProximity: () => Promise<void> | void;
  proximitySupported: boolean;
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
    key: "emerald",
    name: "Emerald",
    description: "Fresh glass greens with lush accents.",
    icon: <Leaf size={16} />,
  },
  {
    key: "midnight",
    name: "Midnight",
    description: "Moody dark mode for late-night sessions.",
    icon: <Moon size={16} />,
  },
];

// SettingsPanel exposes theme, backup, notification, and developer utilities inside
// a single glass sheet so users can tweak global behavior without leaving the home view.
// It’s intentionally dense (palettes + data tools + experimental toggles) so we lean on icons
// and section headings rather than splitting into multiple modals.
export default function SettingsPanel({
  open,
  onClose,
  favoriteVenues,
  setFavoriteVenues,
  onResetData,
  onResetApp,
  onClearAchievements,
  proximityEnabled,
  onToggleProximity,
  proximitySupported,
}: SettingsPanelProps) {
  const { theme, setTheme } = useContext(ThemeContext);
  const { exportBackup, importBackupFromFile } = useDataBackup(favoriteVenues, setFavoriteVenues);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(isHapticsEnabled());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    setIsExporting(true);
    try {
      exportBackup();
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleHaptics = async () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    persistHapticsPreference(next);
    if (next) {
      await triggerImpact(ImpactStyle.Light);
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Personalize</p>
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
                        onClick={async () => {
                          await triggerImpact(isActive ? ImpactStyle.Light : ImpactStyle.Medium);
                          setTheme(item.key);
                        }}
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
                className="space-y-3 border-t border-transparent pt-4"
                style={{ borderColor: "color-mix(in srgb, var(--color-accent) 50%, transparent)" }}
              >
                <div className="flex items-center gap-2 text-[var(--color-accent)]">
                  <MapPin size={20} strokeWidth={2.3} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Nearby venue alerts
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Alerts when you’re near a saved venue. Requires “Always Allow” on iOS.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={proximitySupported ? onToggleProximity : undefined}
                  disabled={!proximitySupported}
                  className="w-full flex items-center justify-between rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-4 py-3 text-left hover:bg-[var(--color-card)]/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {proximitySupported
                        ? proximityEnabled
                          ? "Enabled"
                          : "Disabled"
                        : "Unavailable"}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {proximitySupported
                        ? proximityEnabled
                          ? "Tap to pause alerts."
                          : "Tap to enable alerts."
                        : "Requires the iOS app."}
                    </p>
                  </div>
                  <span
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                      proximityEnabled && proximitySupported
                        ? "bg-[var(--color-accent)]"
                        : "bg-[var(--color-card-border)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        proximityEnabled && proximitySupported ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </span>
                </button>
              </section>

              <section
                className="space-y-3 border-t border-transparent pt-4"
                style={{ borderColor: "color-mix(in srgb, var(--color-accent) 50%, transparent)" }}
              >
                <div className="flex items-center gap-2">
                  <Waves size={16} className="text-[var(--color-accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Haptic feedback</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Feel a subtle tap on key actions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHaptics}
                  className="w-full flex items-center justify-between rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-4 py-3 text-left hover:bg-[var(--color-card)]/90 transition"
                >
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {hapticsEnabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {hapticsEnabled ? "Tap to mute haptics." : "Tap to enable haptics."}
                    </p>
                  </div>
                  <span
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                      hapticsEnabled ? "bg-[var(--color-accent)]" : "bg-[var(--color-card-border)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        hapticsEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </span>
                </button>
              </section>

              <section
                className="space-y-2 border-t border-transparent pt-4"
                style={{ borderColor: "color-mix(in srgb, var(--color-accent) 60%, transparent)" }}
              >
                {/* Backup/restore lives here so QA/devs can quickly snapshot or recover data while testing. */}
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

              <section
                className="space-y-2 border-t border-transparent pt-4"
                style={{ borderColor: "color-mix(in srgb, var(--color-accent) 60%, transparent)" }}
              >
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-[var(--color-accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Data tools
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Reset the app or manage sample data.
                    </p>
                  </div>
                </div>
                {import.meta.env.VITE_SHOW_DEV_TOOLS === "true" ? (
                  <>
                    {/* Dev utilities—kept in app for internal QA so we can reseed dummy data or nuke everything */}
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
                          Removes all venues, people, favourites, tags, and achievements to mimic
                          a first-time install.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl bg-[var(--color-card)]/95 space-y-2 shadow-level1/40 mt-1.5">
                    <button
                      onClick={async () => {
                        await triggerImpact(ImpactStyle.Heavy);
                        onResetApp();
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-red-200/60 bg-red-500/10 text-sm font-semibold text-red-500 hover:bg-red-500/15 transition"
                    >
                      Erase all data
                    </button>
                  </div>
                )}
              </section>

              <section className="space-y-2 border-t border-white/40 pt-4 text-[var(--color-text-secondary)]">
                <p className="text-xs font-semibold uppercase tracking-wide">About</p>
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

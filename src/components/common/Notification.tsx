import { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import type { NotificationType } from "../../context/NotificationContext";

interface NotificationProps {
  message: string;
  type?: NotificationType;
  onDismiss?: () => void;
  meta?: Record<string, unknown>;
}

// All non-achievement toasts share the same base shell, so this map keeps the palette/animation
// differences declarative (success/info/error). The “celebration” path below bypasses this entirely.
const typeMeta: Record<Exclude<NotificationType, "celebration">, {
  label: string;
  icon: ReactNode;
  badgeBg: string;
  iconColor: string;
  accentBorder: string;
  animation: "glow" | "pulse" | "wave";
}> = {
  success: {
    label: "Success",
    icon: <CheckCircle2 size={18} />,
    badgeBg: "bg-[var(--color-success)]/15",
    iconColor: "text-[var(--color-success)]",
    accentBorder: "border-[var(--color-success)]/30",
    animation: "glow",
  },
  info: {
    label: "Heads up",
    icon: <Info size={18} />,
    badgeBg: "bg-[var(--color-info)]/15",
    iconColor: "text-[var(--color-info)]",
    accentBorder: "border-[var(--color-info)]/30",
    animation: "wave",
  },
  error: {
    label: "Oops",
    icon: <AlertTriangle size={18} />,
    badgeBg: "bg-[var(--color-error)]/15",
    iconColor: "text-[var(--color-error)]",
    accentBorder: "border-[var(--color-error)]/30",
    animation: "pulse",
  },
};

export default function Notification({
  message,
  type = "success",
  onDismiss,
  meta = {},
}: NotificationProps) {

  // Achievements use a bespoke “celebration” card with shimmer + star—it’s visually louder than
  // regular toasts, so we short-circuit here instead of trying to shoehorn it into typeMeta.
  if (type === "celebration") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        role="status"
        aria-live="polite"
      >
        <div className="celebration-toast relative pointer-events-auto rounded-3xl px-5 py-4 shadow-[0_20px_45px_rgba(168,85,247,0.35)] bg-[var(--color-accent)] text-white overflow-hidden w-full max-w-sm ml-auto border border-white/30">
          <motion.div
            className="absolute inset-0 bg-white/15"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.35, 0], scale: [0.8, 1.4, 1.7] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <div className="relative flex items-start gap-4">
            <motion.div
              className="h-11 w-11 rounded-2xl bg-white/25 flex items-center justify-center shadow-lg"
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <svg viewBox="0 0 32 32" className="h-6 w-6 text-white" fill="currentColor">
                <path d="M16 3l3.09 6.26L26 10.27l-5 4.87L22.18 22 16 18.27 9.82 22 11 15.14 6 10.27l6.91-1.01L16 3z" />
              </svg>
            </motion.div>
            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">Achievement</p>
              <p className="text-lg font-semibold leading-snug">{message}</p>
              <p className="text-sm text-white/80 mt-1">{typeof meta?.description === "string" ? meta.description : "Keep going—you’re on a streak."}</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  const visualMeta = typeMeta[type as Exclude<NotificationType, "celebration">];

  // Base toast shell (success/info/error) reuses the same motion wrapper; per-type animation tweaks
  // come from the metadata above so the component stays declarative.
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="pointer-events-auto"
      role="status"
      aria-live="polite"
    >
      <div
        className={`relative pointer-events-auto rounded-3xl px-5 py-4 flex items-start gap-3 border backdrop-blur-xl shadow-[0_18px_36px_rgba(15,23,42,0.25)] bg-[var(--color-surface)]/95 ${visualMeta.accentBorder}`}
      >
        {onDismiss && (
          <button
            type="button"
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-[0_8px_18px_rgba(15,23,42,0.15)] hover:bg-[var(--color-card)]/90 flex items-center justify-center"
            aria-label="Dismiss notification"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            ×
          </button>
        )}
        <motion.div
          className={`relative h-9 w-9 rounded-2xl flex items-center justify-center shadow-level1/40 overflow-hidden ${visualMeta.badgeBg} ${visualMeta.iconColor}`}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1, rotate: visualMeta.animation === "wave" ? [0, -6, 6, 0] : [0, -4, 0] }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {visualMeta.animation === "glow" && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-white/30"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.1, 1.4] }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          )}
          {visualMeta.animation === "pulse" && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-white/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: [0.2, 0.8, 0], scale: [0.9, 1.05, 1.25] }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          )}
          {visualMeta.animation === "wave" && (
            <motion.span
              className="absolute inset-0 bg-white/20"
              style={{ transformOrigin: "left center" }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, 0.6, 0], scaleX: [0, 1, 1.2], x: [0, 4, 6] }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            />
          )}
          {visualMeta.icon}
        </motion.div>
        <div className="flex-1 text-[var(--color-text-primary)]">
          <p className="text-sm font-semibold leading-tight opacity-80">{visualMeta.label}</p>
          <p className="text-sm text-[var(--color-text-primary)] mt-0.5 leading-snug">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

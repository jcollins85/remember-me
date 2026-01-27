import { motion } from "framer-motion";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";

interface PermissionPromptModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

// Pre-permission explainer shown before iOS location/notification prompts.
export default function PermissionPromptModal({
  onConfirm,
  onCancel,
}: PermissionPromptModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-sm rounded-[32px] bg-[var(--color-surface)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.4)] text-center space-y-4"
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 18 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: "transform, opacity" }}
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Nearby alerts</p>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Enable location access
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            To send nearby venue alerts, MetHere needs access to your location. iOS will ask for
            Location and Notifications permissions next.
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            You can change this later in iOS Settings.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              triggerImpact(ImpactStyle.Light);
              onCancel();
            }}
            className="px-4 py-2 rounded-full border border-[var(--color-card-border)] bg-[var(--color-card)]/70 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/90 transition"
          >
            Not now
          </button>
          <button
            onClick={() => {
              triggerImpact(ImpactStyle.Medium);
              onConfirm();
            }}
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold shadow-level1 hover:brightness-105 transition"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

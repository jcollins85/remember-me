import { motion } from "framer-motion";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";

interface Props {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({ name, onConfirm, onCancel, isDeleting = false }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
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
          <p className="text-xs uppercase tracking-wide text-red-400/80">Caution</p>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Confirm delete</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Are you sure you want to delete{" "}
            <strong className="text-[var(--color-text-primary)]">{name}</strong>? This action
            cannot be undone.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              triggerImpact(ImpactStyle.Light);
              onCancel();
            }}
            className="px-4 py-2 rounded-full border border-[var(--color-card-border)] !bg-[var(--color-card)] text-sm text-[var(--color-text-primary)] shadow-[0_3px_10px_rgba(15,23,42,0.08)] hover:!bg-[var(--color-card)]/95 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              triggerImpact(ImpactStyle.Heavy);
              onConfirm();
            }}
            disabled={isDeleting}
            className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold shadow-level1 hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
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
        className="glass-panel w-full max-w-md overflow-hidden flex flex-col shadow-[0_30px_80px_rgba(15,23,42,0.2)]"
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 18 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: "transform, opacity" }}
      >
        <div className="flex items-center gap-3 px-6 py-5 bg-[var(--color-surface)]/90 backdrop-blur-lg">
          <div className="w-11 h-11 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center shadow-[0_8px_18px_rgba(15,23,42,0.18)] border border-white/20">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-red-400/80">Caution</p>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Confirm Delete</h2>
          </div>
        </div>
        <div className="px-6 py-5 bg-[var(--color-card)] text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            Are you sure you want to delete <strong className="text-[var(--color-text-primary)]">{name}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 bg-[var(--color-card)]">
          <button
            onClick={() => {
              triggerImpact(ImpactStyle.Light);
              onCancel();
            }}
            className="px-4 py-2 rounded-full border border-white/40 text-sm text-[var(--color-text-secondary)] hover:bg-white/60 hover:text-[var(--color-text-primary)] transition"
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

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import type { NotificationType } from "../../context/NotificationContext";

interface NotificationProps {
  message: string;
  type?: NotificationType;
  onDismiss?: () => void;
}

const typeMeta: Record<NotificationType, {
  label: string;
  icon: ReactNode;
  badgeBg: string;
  iconColor: string;
  accentBorder: string;
}> = {
  success: {
    label: "Success",
    icon: <CheckCircle2 size={18} />,
    badgeBg: "bg-[var(--color-success)]/15",
    iconColor: "text-[var(--color-success)]",
    accentBorder: "border-[var(--color-success)]/30",
  },
  info: {
    label: "Heads up",
    icon: <Info size={18} />,
    badgeBg: "bg-[var(--color-info)]/15",
    iconColor: "text-[var(--color-info)]",
    accentBorder: "border-[var(--color-info)]/30",
  },
  error: {
    label: "Oops",
    icon: <AlertTriangle size={18} />,
    badgeBg: "bg-[var(--color-error)]/15",
    iconColor: "text-[var(--color-error)]",
    accentBorder: "border-[var(--color-error)]/30",
  },
};

export default function Notification({
  message,
  type = "success",
  onDismiss,
}: NotificationProps) {
  const meta = typeMeta[type];

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
      <div className={`relative pointer-events-auto rounded-3xl bg-[var(--color-card)] px-5 py-4 shadow-level1 flex items-start gap-3 border ${meta.accentBorder}`}>
        {onDismiss && (
          <button
            type="button"
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white/85 text-[var(--color-text-primary)] shadow-[0_8px_18px_rgba(15,23,42,0.15)] hover:bg-white flex items-center justify-center"
            aria-label="Dismiss notification"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            ×
          </button>
        )}
        <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shadow-level1/40 ${meta.badgeBg} ${meta.iconColor}`}>
          {meta.icon}
        </div>
        <div className="flex-1 text-[var(--color-text-primary)]">
          <p className="text-sm font-semibold leading-tight">{meta.label}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-snug">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

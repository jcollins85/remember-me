import { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import type { NotificationType } from "../../context/NotificationContext";

interface NotificationProps {
  message: string;
  type?: NotificationType;
}

const typeMeta: Record<NotificationType, {
  label: string;
  icon: ReactNode;
  badgeBg: string;
  iconColor: string;
}> = {
  success: {
    label: "Success",
    icon: <CheckCircle2 size={18} />,
    badgeBg: "bg-[var(--color-success)]/15",
    iconColor: "text-[var(--color-success)]",
  },
  info: {
    label: "Heads up",
    icon: <Info size={18} />,
    badgeBg: "bg-[var(--color-info)]/15",
    iconColor: "text-[var(--color-info)]",
  },
  error: {
    label: "Oops",
    icon: <AlertTriangle size={18} />,
    badgeBg: "bg-[var(--color-error)]/15",
    iconColor: "text-[var(--color-error)]",
  },
};

export default function Notification({ message, type = "success" }: NotificationProps) {
  const meta = typeMeta[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed bottom-8 inset-x-0 z-50 px-4 pointer-events-none flex justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-2xl bg-[var(--color-surface-alt)]/95 border border-white/50 px-4 py-3 shadow-level1 min-w-[260px] max-w-md flex items-start gap-3 backdrop-blur-xl">
        <div className={`h-8 w-8 rounded-2xl flex items-center justify-center ${meta.badgeBg} ${meta.iconColor}`}>
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

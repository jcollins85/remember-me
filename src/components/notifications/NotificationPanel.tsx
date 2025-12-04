import React from "react";
import { X, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { NotificationEntry } from "../../context/NotificationContext";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationEntry[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

const typeMeta = {
  success: {
    icon: <CheckCircle2 size={16} />,
    className: "text-[var(--color-success)]",
  },
  info: {
    icon: <Info size={16} />,
    className: "text-[var(--color-info)]",
  },
  error: {
    icon: <AlertTriangle size={16} />,
    className: "text-[var(--color-error)]",
  },
} as const;

export default function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
}: NotificationPanelProps) {
  if (!open) return null;

  const hasNotifications = notifications.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/10 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-sm mt-20 mr-4 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
              Activity
            </p>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Notifications
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {hasNotifications && (
              <button
                className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                onClick={onMarkAllRead}
              >
                Mark all read
              </button>
            )}
            <button
              className="h-8 w-8 rounded-full border border-white/70 text-[var(--color-text-secondary)] hover:bg-white"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {!hasNotifications ? (
          <div className="text-center text-[var(--color-text-secondary)] py-6 text-sm">
            You're all caught up. Come back when there's more activity.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((entry) => {
              const meta = typeMeta[entry.type];
              return (
                <div
                  key={entry.id}
                  className={`rounded-2xl border px-3 py-2 flex gap-3 items-start ${
                    entry.read
                      ? "border-white/60 bg-white/60 opacity-70"
                      : "border-[var(--color-accent)]/40 bg-white shadow-level1"
                  }`}
                  onClick={() => onMarkRead(entry.id)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/80 ${meta.className}`}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-text-primary)]">{entry.message}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!entry.read && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

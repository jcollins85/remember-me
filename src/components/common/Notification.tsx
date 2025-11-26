interface NotificationProps {
  message: string;
  type?: "success" | "error" | "info";
}

export default function Notification({ message, type = "success" }: NotificationProps) {
  const background =
    type === "success"
      ? "var(--color-success)"
      : type === "error"
      ? "var(--color-error)"
      : "var(--color-info)";

  return (
    <div
      className="text-white fixed bottom-24 right-6 px-4 py-2 rounded-full shadow z-50 animate-fadeIn font-medium text-[var(--font-size-ui)]"
      style={{ background }}
    >
      {message}
    </div>
  );
}

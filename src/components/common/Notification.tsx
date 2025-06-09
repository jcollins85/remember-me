interface NotificationProps {
  message: string;
  type?: "success" | "error" | "info";
}

export default function Notification({ message, type = "success" }: NotificationProps) {
  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-blue-600";

  return (
    <div
      className={`${bgColor} text-white fixed bottom-24 right-6 px-4 py-2 rounded shadow z-50 animate-fadeIn`}
    >
      {message}
    </div>
  );
}
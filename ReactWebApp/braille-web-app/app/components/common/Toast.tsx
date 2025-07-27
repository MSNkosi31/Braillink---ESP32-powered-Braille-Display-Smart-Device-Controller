import React, { useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-md shadow-lg flex items-center`}>
      <div className="mr-2">
        {type === "success" ? (
          <FaCheckCircle className="text-lg" />
        ) : (
          <FaTimesCircle className="text-lg" />
        )}
      </div>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200"
        aria-label="Close toast"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast;
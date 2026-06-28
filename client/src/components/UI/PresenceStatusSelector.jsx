import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const PresenceStatusSelector = ({ currentStatus = "online", onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const statuses = [
    { value: "online", label: "Online", color: "bg-green-500" },
    { value: "away", label: "Away", color: "bg-yellow-500" },
    { value: "busy", label: "Busy", color: "bg-red-500" },
    { value: "offline", label: "Offline", color: "bg-gray-500" },
  ];

  const current = statuses.find((s) => s.value === currentStatus) || statuses[0];

  const handleStatusChange = (status) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition text-sm font-medium"
      >
        <div className={`w-2.5 h-2.5 rounded-full ${current.color}`} />
        <span>{current.label}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition ${
                currentStatus === status.value
                  ? "bg-slate-600 text-white"
                  : "text-slate-300 hover:bg-slate-600"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${status.color}`} />
              {status.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PresenceStatusSelector;

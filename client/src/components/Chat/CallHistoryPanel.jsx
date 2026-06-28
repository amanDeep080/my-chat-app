import React, { useEffect } from "react";
import { useCallHistory } from "../../hooks/useCallHistory";
import useAuthStore from "../../store/authStore";
import { Phone, PhoneOff, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";


const CallHistoryPanel = ({ onStartCall }) => {
  const { token } = useAuthStore();
  const { callHistory, loading, fetchCallHistory, deleteCallRecord } = useCallHistory(token);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getCallIcon = (type) => {
    if (type === "video") {
      return "📹";
    } else if (type === "audio") {
      return "🔊";
    } else if (type === "screen") {
      return "🖥️";
    }
    return "📞";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "missed":
        return "text-red-400";
      case "declined":
        return "text-yellow-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-blue-400" />
          <h2 className="text-lg font-bold text-white">Call History</h2>
        </div>
      </div>

      <div className="divide-y divide-slate-700">
        {loading ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            Loading...
          </div>
        ) : callHistory.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            No call history
          </div>
        ) : (
          callHistory.map((call) => (
            <div
              key={call.callId}
              className="p-4 hover:bg-slate-700 transition group flex items-center gap-3"
            >
              {/* Call type icon */}
              <span className="text-2xl">{getCallIcon(call.type)}</span>

              {/* Call info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {call.initiatorDetails?.displayName || "Unknown"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs ${getStatusColor(call.status)}`}>
                    {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                  </span>
                  {call.duration > 0 && (
                    <>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">
                        {formatDuration(call.duration)}
                      </span>
                    </>
                  )}
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">
                    {call.startedAt ? (
                      formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })
                    ) : (
                      "Unknown time"
                    )}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() =>
                    onStartCall?.(call.initiatorDetails?.uid, call.type === "video")
                  }
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                  title="Call back"
                >
                  <Phone size={16} />
                </button>
                <button
                  onClick={() => deleteCallRecord(call.callId)}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CallHistoryPanel;

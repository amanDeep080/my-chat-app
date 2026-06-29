import React, { useEffect } from "react";
import { useCallHistory } from "../../hooks/useCallHistory";
import useAuthStore from "../../store/authStore";
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
    switch (type) {
      case "video": return "📹";
      case "audio": return "🔊";
      case "screen": return "🖥️";
      default: return "📞";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "#22c55e";
      case "missed": return "#ef4444";
      case "declined": return "#f59e0b";
      default: return "#64748b";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
          Loading calls...
        </div>
      ) : callHistory.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
          No call history
        </div>
      ) : (
        callHistory.map((call) => (
          <div
            key={call.callId}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 8px",
              borderRadius: 12, background: "var(--bg-side)", marginBottom: 4
            }}
          >
            <div style={{ fontSize: 20 }}>{getCallIcon(call.type)}</div>

            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {call.initiatorDetails?.displayName || "Unknown User"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: getStatusColor(call.status), textTransform: "capitalize" }}>
                  {call.status}
                </span>
                {call.duration > 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    • {formatDuration(call.duration)}
                  </span>
                )}
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  • {call.startedAt ? formatDistanceToNow(new Date(call.startedAt), { addSuffix: true }) : "Unknown"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => onStartCall?.(call.initiatorDetails?.uid, call.type === "video")}
                style={{
                  background: "var(--primary)", border: "none", borderRadius: 8,
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", cursor: "pointer", fontSize: 14
                }}
                title="Call back"
              >
                📞
              </button>
              <button
                onClick={() => deleteCallRecord(call.callId)}
                style={{
                  background: "transparent", border: "none", borderRadius: 8,
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#ef4444", cursor: "pointer", fontSize: 14
                }}
                title="Delete"
              >
                🗑
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CallHistoryPanel;

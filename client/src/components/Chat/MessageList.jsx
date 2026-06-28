import React, { useState } from "react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import useAuthStore from "../../store/authStore";
import { useSocket } from "../../context/SocketContext";
import useChatStore from "../../store/chatStore";
import api from "../../utils/api";
import toast from "react-hot-toast";


const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

const MessageList = ({ messages, roomId }) => {
  const { user } = useAuthStore();
  const socket = useSocket();
  const { setReplyTo } = useChatStore();
  const [hoveredId, setHoveredId] = useState(null);
  const [showReactions, setShowReactions] = useState(null);

  const handleReact = (messageId, emoji) => {
    socket?.emit("message:react", { messageId, emoji, roomId });
    setShowReactions(null);
  };

  const handleDelete = (messageId) => {
    if (window.confirm("Delete this message?")) {
      socket?.emit("message:delete", { messageId, roomId });
    }
  };

  const handleReport = async (messageId) => {
    const reason = window.prompt("Reason for reporting this message?");
    if (reason) {
      try {
        await api.post(`/messages/${messageId}/report`, { reason });
        toast.success("Message reported to moderators");
      } catch {
        toast.error("Failed to report message");
      }
    }
  };

  const getTimestamp = (ts) => {
    try {
      if (!ts) return "";
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      if (isNaN(date.getTime())) return "";
      return isToday(date) ? format(date, "HH:mm") : isYesterday(date) ? `Yesterday ${format(date, "HH:mm")}` : format(date, "MMM d, HH:mm");
    } catch (e) {
      return "";
    }
  };

  // Group messages by date
  const groups = [];
  let lastDate = null;
  let lastSenderId = null;

  messages.forEach((msg, i) => {
    try {
      const date = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
      if (isNaN(date.getTime())) {
        groups.push({ type: "message", msg, grouped: false });
        return;
      }

      const dateStr = format(date, "yyyy-MM-dd");
      if (dateStr !== lastDate) {
        groups.push({ type: "date", label: isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMMM d, yyyy") });
        lastDate = dateStr;
        lastSenderId = null;
      }
      const grouped = lastSenderId === msg.senderId && !msg.replyTo;
      groups.push({ type: "message", msg, grouped });
      lastSenderId = msg.senderId;
    } catch (e) {
      groups.push({ type: "message", msg, grouped: false });
    }
  });


  return (
    <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
      {groups.map((item, i) => {
        if (item.type === "date") {
          return (
            <div key={`date-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 8px" }}>
              <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{item.label}</span>
              <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
            </div>
          );
        }

        const { msg, grouped } = item;
        const isOwn = msg.senderId === user?.uid;
        const hasReactions = msg.reactions && Object.keys(msg.reactions).filter((e) => msg.reactions[e].length > 0).length > 0;

        return (
          <div
            key={msg.id}
            onMouseEnter={() => setHoveredId(msg.id)}
            onMouseLeave={() => { setHoveredId(null); setShowReactions(null); }}
            style={{ position: "relative", padding: `${grouped ? 1 : 8}px 0 1px`, borderRadius: 8 }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              {/* Avatar */}
              <div style={{ width: 36, flexShrink: 0 }}>
                {!grouped && (
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`}
                    alt={msg.senderName}
                    style={{ width: 36, height: 36, borderRadius: "50%" }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name + time */}
                {!grouped && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 14 }}>{msg.senderName}</span>
                    <span style={{ fontSize: 11, color: "#475569" }}>{getTimestamp(msg.createdAt)}</span>
                    {msg.edited && <span style={{ fontSize: 11, color: "#475569", fontStyle: "italic" }}>(edited)</span>}
                    {msg.forwarded && <span style={{ fontSize: 11, color: "#6366f1" }}>↪ Forwarded from {msg.originalSender}</span>}
                  </div>
                )}

                {/* Reply reference */}
                {msg.replyTo && (
                  <div style={{ borderLeft: "3px solid #6366f1", paddingLeft: 8, marginBottom: 4, fontSize: 12, color: "#64748b" }}>
                    ↩ Replied to a message
                  </div>
                )}

                {/* Message content */}
                <div style={{ color: msg.deleted ? "#475569" : "#cbd5e1", fontSize: 14, lineHeight: 1.6, fontStyle: msg.deleted ? "italic" : "normal" }}>
                  {renderContent(msg)}
                </div>

                {/* Reactions */}
                {hasReactions && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {Object.entries(msg.reactions)
                      .filter(([, uids]) => uids.length > 0)
                      .map(([emoji, uids]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          style={{
                            background: uids.includes(user?.uid) ? "#312e81" : "#1e293b",
                            border: `1px solid ${uids.includes(user?.uid) ? "#6366f1" : "#334155"}`,
                            borderRadius: 12, padding: "2px 8px",
                            cursor: "pointer", fontSize: 13, color: "#f1f5f9",
                            display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          {emoji} {uids.length}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message actions */}
            {hoveredId === msg.id && !msg.deleted && (
              <div style={{
                position: "absolute", right: 16, top: -6,
                display: "flex", gap: 4,
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: 8, padding: "4px 6px",
                zIndex: 10,
              }}>
                {/* React */}
                <button onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                  style={actionBtnStyle} title="React">😄</button>
                {/* Reply */}
                <button onClick={() => setReplyTo(msg)} style={actionBtnStyle} title="Reply">↩</button>
                {/* Bookmark */}
                <button style={actionBtnStyle} title="Bookmark">🔖</button>
                {/* Report */}
                <button onClick={() => handleReport(msg.id)} style={actionBtnStyle} title="Report">🚩</button>
                {/* Delete (own messages only) */}

                {isOwn && (
                  <button onClick={() => handleDelete(msg.id)} style={{ ...actionBtnStyle, color: "#ef4444" }} title="Delete">🗑</button>
                )}

                {/* Reaction picker */}
                {showReactions === msg.id && (
                  <div style={{
                    position: "absolute", top: "100%", right: 0, marginTop: 4,
                    background: "#1e293b", border: "1px solid #334155",
                    borderRadius: 8, padding: 8, display: "flex", gap: 4,
                    zIndex: 20,
                  }}>
                    {REACTIONS.map((e) => (
                      <button key={e} onClick={() => handleReact(msg.id, e)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, padding: 4, borderRadius: 4, transition: "background 0.1s" }}
                        onMouseEnter={(el) => (el.target.style.background = "#334155")}
                        onMouseLeave={(el) => (el.target.style.background = "transparent")}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const actionBtnStyle = {
  background: "transparent", border: "none", cursor: "pointer",
  fontSize: 15, padding: "2px 6px", borderRadius: 4, color: "#94a3b8",
};

function renderContent(msg) {
  if (msg.type === "image" && msg.fileData) {
    return (
      <img
        src={msg.fileData.url}
        alt={msg.fileData.name || msg.fileData.filename}
        style={{ maxWidth: 320, maxHeight: 240, borderRadius: 8, cursor: "pointer", objectFit: "cover" }}
        onClick={() => window.open(msg.fileData.url, "_blank")}
      />
    );
  }
  if (msg.type === "file" && msg.fileData) {
    const fileName = msg.fileData.name || msg.fileData.filename || "File";
    return (
      <a href={msg.fileData.url} target="_blank" rel="noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#1e293b", borderRadius: 8, color: "#6366f1", textDecoration: "none", fontSize: 13 }}>
        📎 {fileName} ({(msg.fileData.size / 1024).toFixed(1)}KB)
      </a>
    );
  }

  if (msg.type === "audio" && msg.fileData) {
    return <audio controls src={msg.fileData.url} style={{ height: 36 }} />;
  }

  // Highlight @mentions
  const parts = msg.content.split(/(@\w+)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} style={{ color: "#818cf8", fontWeight: 600 }}>{part}</span>
        ) : part
      )}
    </span>
  );
}

export default MessageList;

import React, { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import api from "../../utils/api";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
      setUnread(data.notifications.filter((n) => !n.read).length);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const ICONS = {
    mention: "💬",
    reaction: "😄",
    dm: "✉️",
    join: "👋",
    default: "🔔",
  };

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative", background: "transparent", border: "none",
          color: "#64748b", cursor: "pointer", fontSize: 20, padding: 6, borderRadius: 8,
        }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            background: "#ef4444", color: "white",
            borderRadius: 999, minWidth: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, padding: "0 3px",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "100%", marginTop: 8,
          width: 340, background: "#1e293b", border: "1px solid #334155",
          borderRadius: 12, zIndex: 50, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 15 }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: "transparent", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 12 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 14 }}>
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  style={{
                    display: "flex", gap: 12, padding: "12px 16px",
                    cursor: "pointer", background: notif.read ? "transparent" : "rgba(99,102,241,0.08)",
                    borderBottom: "1px solid #1e293b", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = notif.read ? "transparent" : "rgba(99,102,241,0.08)")}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{ICONS[notif.type] || ICONS.default}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, color: "#f1f5f9" }}>{notif.message || notif.title}</p>
                    <span style={{ fontSize: 11, color: "#475569" }}>
                      {(() => {
                        try {
                          if (notif.createdAt?.toDate) return formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true });
                          if (notif.createdAt) return formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true });
                          return "Just now";
                        } catch (e) {
                          return "Just now";
                        }
                      })()}
                    </span>
                  </div>
                  {!notif.read && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

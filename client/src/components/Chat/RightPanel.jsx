import React, { useState, useEffect } from "react";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import CallHistoryPanel from "./CallHistoryPanel";
import toast from "react-hot-toast";

const STATUS_COLORS = { online: "#22c55e", away: "#f59e0b", busy: "#ef4444", offline: "#64748b" };

const RightPanel = ({ room, panel }) => {
  const { setRightPanel, onlineUsers, setActiveRoom } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);

  useEffect(() => {
    if (panel === "pinned" && room?.pinnedMessages?.length > 0) {
      fetchPinned();
    }
  }, [panel, room]);

  const fetchPinned = async () => {
    try {
      const results = await Promise.all(
        room.pinnedMessages.map((id) => api.get(`/messages/${id}`).then((r) => r.data.message))
      );
      setPinnedMessages(results);
    } catch (err) {
      console.error("Failed to fetch pinned messages:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const { data } = await api.get(`/messages/room/${room.id}/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.messages);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleStartDM = async (otherUserId) => {
    if (otherUserId === currentUser?.uid) return;
    try {
      const { data } = await api.post("/dms/create", { otherUserId });
      const res = await api.get("/rooms/my-rooms");
      useChatStore.getState().setRooms(res.data.rooms);
      const newRoom = res.data.rooms.find(r => r.id === data.roomId);
      if (newRoom) {
        setActiveRoom(newRoom);
        setRightPanel(null);
      }
    } catch (err) {
      toast.error("Failed to start direct message");
    }
  };

  return (
    <div style={{
      width: 280, background: "var(--bg-main)", borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column", height: "100vh",
    }}>
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-main)", textTransform: "capitalize" }}>
          {panel === "members" ? "👥 Members" :
           panel === "search" ? "🔍 Search" :
           panel === "pinned" ? "📌 Pinned" :
           panel === "settings" ? "⚙️ Settings" :
           "📞 Call History"}
        </h3>
        <button onClick={() => setRightPanel(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>

        {/* MEMBERS */}
        {panel === "members" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "8px 4px 4px" }}>
              {room?.memberIds?.length || 0} Members
            </div>
            {room?.members?.map((member) => {
              const status = onlineUsers[member.uid]?.status || member.status || "offline";
              return (
                <div key={member.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderRadius: 8 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
                      src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                      alt={member.name}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 9, height: 9, borderRadius: "50%",
                      background: STATUS_COLORS[status],
                      border: "2px solid var(--bg-main)",
                    }} />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{member.role}</div>
                  </div>
                  {member.uid !== currentUser?.uid && (
                    <button
                      onClick={() => handleStartDM(member.uid)}
                      title="Message"
                      style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 16 }}
                    >
                      💬
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SEARCH */}
        {panel === "search" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search messages..."
                style={{
                  flex: 1, background: "var(--bg-chat)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 12px", color: "var(--text-main)",
                  fontSize: 13, outline: "none",
                }}
              />
              <button
                onClick={handleSearch}
                style={{ background: "var(--primary)", border: "none", borderRadius: 8, padding: "0 12px", color: "white", cursor: "pointer" }}
              >
                →
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Jump to Date</div>
              <input
                type="date"
                onChange={async (e) => {
                  const date = new Date(e.target.value);
                  alert("Jumping to " + date.toLocaleDateString());
                }}
                style={{
                  width: "100%", background: "var(--bg-chat)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 12px", color: "var(--text-main)", fontSize: 13
                }}
              />
            </div>

            {searchResults.map((msg) => (
              <div key={msg.id} style={{ padding: "10px", background: "var(--bg-side)", borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, marginBottom: 4 }}>{msg.senderName}</div>
                <div style={{ fontSize: 13, color: "var(--text-main)" }}>{msg.content}</div>
              </div>
            ))}

            {searchResults.length === 0 && searchQuery && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 24 }}>No results found</div>
            )}
          </div>
        )}

        {/* PINNED */}
        {panel === "pinned" && (
          <div>
            {pinnedMessages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 24 }}>
                No pinned messages
              </div>
            ) : (
              pinnedMessages.map((msg) => (
                <div key={msg.id} style={{ padding: "10px", background: "var(--bg-side)", borderRadius: 8, marginBottom: 8, borderLeft: "3px solid var(--primary)" }}>
                  <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, marginBottom: 4 }}>{msg.senderName}</div>
                  <div style={{ fontSize: 13, color: "var(--text-main)" }}>{msg.content}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SETTINGS */}
        {panel === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Channel Info</div>
              <div style={{ background: "var(--bg-side)", padding: 12, borderRadius: 12 }}>
                <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: 14 }}>#{room.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>{room.description || "No description"}</div>
                {room.inviteCode && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>INVITE CODE</div>
                    <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: 14, marginTop: 2 }}>{room.inviteCode}</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Preferences</div>
              <div style={{ background: "var(--bg-side)", padding: 12, borderRadius: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Notifications</div>
                <select
                  onChange={async (e) => {
                    await api.put(`/rooms/${room.id}/member-settings`, { notificationPreference: e.target.value });
                  }}
                  defaultValue={room.members?.find(m => m.uid === currentUser?.uid)?.notificationPreference || "all"}
                  style={{ width: "100%", background: "var(--bg-main)", border: "1px solid var(--border)", color: "var(--text-main)", padding: "6px", borderRadius: 6, fontSize: 13 }}
                >
                  <option value="all">All Messages</option>
                  <option value="mentions">Mentions Only</option>
                  <option value="mute">Mute All</option>
                </select>
              </div>

              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  onClick={async () => {
                    const { data } = await api.post(`/rooms/${room.id}/toggle-mute`);
                    toast.success(data.muted ? "Channel muted" : "Channel unmuted");
                  }}
                  style={actionBtnStyle}
                >
                  🔇 Mute Notifications
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm("Leave this channel?")) {
                      await api.post(`/rooms/${room.id}/leave`);
                      window.location.href = "/";
                    }
                  }}
                  style={{ ...actionBtnStyle, color: "#ef4444" }}
                >
                  🚪 Leave Channel
                </button>
                {room.createdBy === currentUser?.uid && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Archive this channel?")) {
                        await api.post(`/rooms/${room.id}/archive`);
                        toast.success("Channel archived");
                      }
                    }}
                    style={actionBtnStyle}
                  >
                    📦 Archive Channel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const actionBtnStyle = {
  width: "100%", background: "var(--bg-side)", border: "none", borderRadius: 8,
  padding: "10px 12px", color: "var(--text-main)", cursor: "pointer",
  fontSize: 13, textAlign: "left", transition: "background 0.2s",
  display: "flex", alignItems: "center", gap: 10,
};

export default RightPanel;

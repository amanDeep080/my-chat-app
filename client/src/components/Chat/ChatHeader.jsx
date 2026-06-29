import React from "react";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";

const ChatHeader = ({ room, onStartAudioCall, onStartVideoCall, onCallHistory }) => {
  const { toggleSidebar, setRightPanel, rightPanel, onlineUsers, setActiveRoom } = useChatStore();
  const { user } = useAuthStore();
  const isMobile = window.innerWidth < 768;

  if (!room) return null;

  const getDMUser = () => room.members?.find((m) => m.uid !== user?.uid);
  const isDM = room.type === "dm" || room.type === "direct" || room.isDM;
  const dmUser = isDM ? getDMUser() : null;

  const dmStatus = dmUser ? (onlineUsers[dmUser.uid]?.status || "offline") : null;

  const onlineCount = room.type !== "dm"
    ? room.memberIds?.filter((uid) => ["online", "away"].includes(onlineUsers[uid]?.status)).length
    : null;

  return (
    <div style={{
      padding: "12px 20px",
      borderBottom: "1px solid #1e293b",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#0f172a",
      zIndex: 10,
    }}>
      {/* Back button on mobile, Hamburger on Desktop */}
      <button
        onClick={() => isMobile ? setActiveRoom(null) : toggleSidebar()}
        style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20, padding: 4 }}
      >
        {isMobile ? "←" : "☰"}
      </button>

      {/* Room info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isDM ? (
            <div style={{ position: "relative" }}>
              <img
                src={dmUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dmUser?.username}`}
                alt={dmUser?.name}
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 9, height: 9, borderRadius: "50%",
                background: dmStatus === "online" ? "#22c55e" : dmStatus === "away" ? "#f59e0b" : "#64748b",
                border: "2px solid #0f172a",
              }} />
            </div>
          ) : (
            <span style={{ fontSize: 20 }}>#</span>
          )}

          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
              {isDM ? dmUser?.name : room.name}
            </h2>
            {!isDM && room.topic && (
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{room.topic}</p>
            )}
            {isDM && dmStatus && (
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                {dmStatus === "online" ? "Online" : dmUser?.statusMessage || dmStatus}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 4 }}>
        {isDM && (
          <>
            <button
              onClick={() => onStartAudioCall?.()}
              disabled={dmStatus === "offline"}
              title="Start audio call"
              style={{
                background: "transparent",
                border: "none", borderRadius: 8, padding: "6px 10px",
                color: dmStatus === "offline" ? "#64748b" : "#64748b",
                cursor: dmStatus === "offline" ? "not-allowed" : "pointer",
                fontSize: 16, transition: "all 0.15s", opacity: dmStatus === "offline" ? 0.5 : 1,
              }}
            >
              🔊
            </button>
            <button
              onClick={() => onStartVideoCall?.()}
              disabled={dmStatus === "offline"}
              title="Start video call"
              style={{
                background: "transparent",
                border: "none", borderRadius: 8, padding: "6px 10px",
                color: dmStatus === "offline" ? "#64748b" : "#64748b",
                cursor: dmStatus === "offline" ? "not-allowed" : "pointer",
                fontSize: 16, transition: "all 0.15s", opacity: dmStatus === "offline" ? 0.5 : 1,
              }}
            >
              📹
            </button>
            <button
              onClick={() => onCallHistory?.()}
              title="Call history"
              style={{
                background: rightPanel === "callHistory" ? "#1e293b" : "transparent",
                border: "none", borderRadius: 8, padding: "6px 10px",
                color: rightPanel === "callHistory" ? "#6366f1" : "#64748b",
                cursor: "pointer", fontSize: 16, transition: "all 0.15s",
              }}
            >
              📞
            </button>
          </>
        )}
        {[
          { icon: "🔍", panel: "search", title: "Search messages" },
          { icon: "📌", panel: "pinned", title: "Pinned messages" },
          { icon: "👥", panel: "members", title: "Members" },
          { icon: "⚙️", panel: "settings", title: "Channel settings" },
        ].map(({ icon, panel, title }) => (

          <button
            key={panel}
            onClick={() => setRightPanel(panel)}
            title={title}
            style={{
              background: rightPanel === panel ? "#1e293b" : "transparent",
              border: "none", borderRadius: 8, padding: "6px 10px",
              color: rightPanel === panel ? "#6366f1" : "#64748b",
              cursor: "pointer", fontSize: 16, transition: "all 0.15s",
            }}
          >
            {icon}
          </button>
        ))}

        {onlineCount !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px", fontSize: 13, color: "#64748b" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            {onlineCount} online
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import { formatDistanceToNow } from "date-fns";
import CreateRoomModal, { JoinRoomModal } from "../Modals/CreateRoomModal";
import PresenceStatusSelector from "../UI/PresenceStatusSelector";
import usePresence from "../../hooks/usePresence";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_COLORS = { online: "#22c55e", away: "#f59e0b", busy: "#ef4444", offline: "#64748b" };

const safeFormatDistance = (dateInput) => {
  try {
    if (!dateInput) return "";
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    return formatDistanceToNow(date, { addSuffix: false });
  } catch (e) {
    return "";
  }
};

const UserSearchView = ({ onSelect }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val) => {
    setQ(val);
    if (val.length < 2) return setResults([]);
    setLoading(true);
    try {
      const { data } = await api.get(`/dms/search?q=${val}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <input
        value={q}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by username..."
        style={{
          width: "100%", background: "var(--bg-chat)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "8px 12px", color: "var(--text-main)", fontSize: 13, outline: "none"
        }}
      />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && <div style={{ textAlign: "center", padding: 10, fontSize: 12, color: "var(--text-muted)" }}>Searching...</div>}
        {results.map((u) => (
          <div
            key={u.uid}
            onClick={() => onSelect(u.uid)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px",
              cursor: "pointer", borderRadius: 8, transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-side)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <img src={u.avatar} style={{ width: 32, height: 32, borderRadius: "50%" }} alt="" />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>{u.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>@{u.username}</div>
            </div>
          </div>
        ))}
        {!loading && q.length >= 2 && results.length === 0 && (
          <div style={{ textAlign: "center", padding: 10, fontSize: 12, color: "var(--text-muted)" }}>No users found</div>
        )}
      </div>
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { rooms, activeRoom, setActiveRoom, unreadCounts, clearUnread, onlineUsers } = useChatStore();
  const { user, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("rooms"); // rooms | dms | search_users
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { setUserStatus } = usePresence();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLanguage();

  const filteredRooms = rooms.filter((r) => {
    const isRoomDM = r.type === "dm" || r.type === "direct" || r.isDM;
    const matchesType = tab === "dms" ? isRoomDM : !isRoomDM;
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.members?.some((m) => m.name?.toLowerCase().includes(search.toLowerCase()));
    return matchesType && (search === "" || matchesSearch);
  });

  const handleRoomSelect = (room) => {
    setActiveRoom(room);
    clearUnread(room.id);
    navigate(`/room/${room.id}`);
  };

  const getDMName = (room) => {
    const other = room.members?.find((m) => m.uid !== user?.uid);
    return other?.name || other?.username || "Unknown";
  };

  const getDMAvatar = (room) => {
    const other = room.members?.find((m) => m.uid !== user?.uid);
    return other?.avatar;
  };

  const getOnlineStatus = (room) => {
    const isRoomDM = room.type === "dm" || room.type === "direct" || room.isDM;
    if (isRoomDM) {
      const other = room.members?.find((m) => m.uid !== user?.uid);
      return onlineUsers[other?.uid]?.status || "offline";
    }
    return null;
  };

  return (
    <>
      <div style={{
        width: 280,
        background: "var(--bg-main)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}>
        {/* Header */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--primary)", margin: 0 }}>⚡ ChatApp</h1>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowJoinModal(true)} title="Join room"
                style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-muted)", cursor: "pointer" }}>
                #
              </button>
              <button onClick={() => setShowCreateModal(true)} title="Create room"
                style={{ background: "var(--primary)", border: "none", borderRadius: 6, padding: "4px 8px", color: "white", cursor: "pointer", fontWeight: 700 }}>
                +
              </button>
            </div>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            style={{
              width: "100%", background: "var(--bg-chat)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "8px 12px", color: "var(--text-main)",
              fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {["rooms", "dms"].map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, border: "none", cursor: "pointer",
                  background: tab === tabKey ? "var(--primary)" : "transparent",
                  color: tab === tabKey ? "white" : "var(--text-muted)",
                  fontSize: 13, fontWeight: 500, textTransform: "capitalize",
                }}
              >
                {tabKey === "dms" ? t("dms") : t("channels")}
              </button>
            ))}
          </div>

          {tab === "dms" && (
            <button
              onClick={() => setTab("search_users")}
              style={{
                width: "100%", marginTop: 8, padding: "6px", borderRadius: 6,
                border: "1px dashed var(--border)", background: "transparent",
                color: "var(--text-muted)", fontSize: 12, cursor: "pointer"
              }}
            >
              🔍 Find People
            </button>
          )}
        </div>

        {/* User Search View */}
        {tab === "search_users" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px", background: "var(--bg-main)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>Find People</span>
              <button onClick={() => setTab("dms")} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
            <UserSearchView onSelect={async (otherUserId) => {
              try {
                const { data } = await api.post("/dms/create", { otherUserId });
                const res = await api.get("/rooms/my-rooms");
                useChatStore.getState().setRooms(res.data.rooms);
                const newRoom = res.data.rooms.find(r => r.id === data.roomId);
                if (newRoom) {
                  setActiveRoom(newRoom);
                  navigate(`/room/${newRoom.id}`);
                  setTab("dms");
                }
              } catch (err) {
                console.error("Failed to start DM", err);
              }
            }} />
          </div>
        )}

        {/* Room list */}
        {tab !== "search_users" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {filteredRooms.map((room) => {
              const isActive = activeRoom?.id === room.id;
              const unread = unreadCounts[room.id] || 0;
              const status = getOnlineStatus(room);
              const isRoomDM = room.type === "dm" || room.type === "direct" || room.isDM;
              const name = isRoomDM ? getDMName(room) : room.name;
              const avatar = isRoomDM ? getDMAvatar(room) : null;

              return (
                <div
                  key={room.id}
                  onClick={() => handleRoomSelect(room)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", cursor: "pointer", borderRadius: 8, margin: "2px 8px",
                    background: isActive ? "var(--bg-side)" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-side)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {avatar ? (
                      <img src={avatar} alt={name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{
                        width: 36, height: 36, borderRadius: isRoomDM ? "50%" : 10,
                        background: "var(--primary)", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white",
                      }}>
                        {isRoomDM ? name[0]?.toUpperCase() : "#"}
                      </div>
                    )}
                    {status && (
                      <div style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 10, height: 10, borderRadius: "50%",
                        background: STATUS_COLORS[status],
                        border: "2px solid var(--bg-main)",
                      }} />
                    )}
                  </div>

                  {/* Name & last message */}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: unread > 0 ? 600 : 400, fontSize: 14, color: unread > 0 ? "var(--text-main)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                      </span>
                      {room.lastMessage && room.lastMessage.createdAt && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, marginLeft: 4 }}>
                          {safeFormatDistance(room.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {room.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {unread > 0 && (
                    <div style={{
                      background: "var(--primary)", color: "white",
                      borderRadius: 999, minWidth: 18, height: 18,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, padding: "0 4px", flexShrink: 0,
                    }}>
                      {unread > 99 ? "99+" : unread}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRooms.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 32, fontSize: 14 }}>
                No {tab} found
              </div>
            )}
          </div>
        )}

        {/* User profile footer */}
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", background: "var(--bg-side)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <PresenceStatusSelector
              currentStatus="online"
              onStatusChange={setUserStatus}
            />
            <button
              onClick={toggleTheme}
              style={{
                flex: 1, background: "var(--bg-main)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text-main)", cursor: "pointer", fontSize: 12
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{
                background: "var(--bg-main)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text-main)", cursor: "pointer", fontSize: 12, padding: "0 4px"
              }}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                alt={user?.name}
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS.online, border: "2px solid var(--bg-main)" }} />
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>@{user?.username}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}
            >
              ⏻
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && <CreateRoomModal onClose={() => setShowCreateModal(false)} />}
      {showJoinModal && <JoinRoomModal onClose={() => setShowJoinModal(false)} />}
    </>
  );
};

export default Sidebar;

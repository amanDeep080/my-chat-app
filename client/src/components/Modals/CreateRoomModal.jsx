import React, { useState } from "react";
import api from "../../utils/api";
import useChatStore from "../../store/chatStore";
import toast from "react-hot-toast";

const CreateRoomModal = ({ onClose }) => {
  const { addRoom, setActiveRoom } = useChatStore();
  const [form, setForm] = useState({ name: "", description: "", type: "public" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Room name required");
    setLoading(true);
    try {
      const { data } = await api.post("/rooms", form);
      addRoom(data.room);
      setActiveRoom(data.room);
      toast.success(`#${data.room.name} created!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h2 style={titleStyle}>Create Channel</h2>
      <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Channel Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value.replace(/\s+/g, "-").toLowerCase() })}
            placeholder="e.g. general"
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Description (optional)</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's this channel about?"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { v: "public", icon: "🌐", label: "Public" },
              { v: "private", icon: "🔒", label: "Private" },
              { v: "group_dm", icon: "👥", label: "Group DM" }
            ].map(({ v, icon, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, type: v, name: v === "group_dm" ? "" : form.name })}
                style={{
                  flex: "1 1 100px", padding: "10px", borderRadius: 8,
                  border: `1px solid ${form.type === v ? "#6366f1" : "#334155"}`,
                  background: form.type === v ? "#312e81" : "#0f172a",
                  color: form.type === v ? "#a5b4fc" : "#64748b",
                  cursor: "pointer", fontSize: 14, fontFamily: "inherit",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
        {form.type === "group_dm" && (
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Invite friends to your group DM after creating it.
          </p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button type="submit" disabled={loading} style={submitBtnStyle}>
            {loading ? "Creating..." : "Create Channel"}
          </button>
        </div>
      </form>
    </Overlay>
  );
};

export const JoinRoomModal = ({ onClose }) => {
  const { addRoom, setActiveRoom } = useChatStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const { data } = await api.get(`/rooms?search=${encodeURIComponent(query)}`);
      setResults(data.rooms);
      setHasSearched(true);
    } catch {}
  };

  const handleJoin = async (roomId) => {
    setJoining(roomId);
    try {
      const { data } = await api.post(`/rooms/${roomId}/join`, { inviteCode });
      addRoom(data.room);
      setActiveRoom(data.room);
      toast.success("Joined channel!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to join");
    } finally {
      setJoining(null);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h2 style={titleStyle}>Browse Channels</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search channels..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={handleSearch} style={submitBtnStyle}>Search</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
        {results.map((room) => (
          <div key={room.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#0f172a", borderRadius: 8, border: "1px solid #334155" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>#{room.name}</div>
              {room.description && <div style={{ color: "#64748b", fontSize: 12 }}>{room.description}</div>}
              <div style={{ color: "#475569", fontSize: 11 }}>{room.memberIds?.length || 0} members</div>
            </div>
            <button
              onClick={() => handleJoin(room.id)}
              disabled={joining === room.id}
              style={{ ...submitBtnStyle, padding: "6px 14px", fontSize: 13 }}
            >
              {joining === room.id ? "..." : "Join"}
            </button>
          </div>
        ))}
        {results.length === 0 && hasSearched && (
          <div style={{ textAlign: "center", color: "#475569", padding: 24, fontSize: 14 }}>No channels found</div>
        )}
      </div>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #334155" }}>
        <label style={labelStyle}>Join Private Channel by Invite Code</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="XXXXXXXX" style={{ ...inputStyle, flex: 1, letterSpacing: 2 }} />
        </div>
      </div>
    </Overlay>
  );
};

// Shared overlay wrapper
const Overlay = ({ children, onClose }) => (
  <div
    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", padding: 28, width: "100%", maxWidth: 440 }}>
      {children}
    </div>
  </div>
);

const labelStyle = { display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 };
const inputStyle = { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const titleStyle = { color: "#f1f5f9", margin: "0 0 20px", fontSize: 20, fontWeight: 700 };
const cancelBtnStyle = { flex: 1, padding: "10px", background: "transparent", border: "1px solid #334155", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit", fontSize: 14 };
const submitBtnStyle = { flex: 1, padding: "10px", background: "#6366f1", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 };

export default CreateRoomModal;

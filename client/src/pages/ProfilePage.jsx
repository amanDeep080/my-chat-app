import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../utils/api";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "online", label: "🟢 Online", color: "#22c55e" },
  { value: "away", label: "🟡 Away", color: "#f59e0b" },
  { value: "busy", label: "🔴 Busy", color: "#ef4444" },
  { value: "offline", label: "⚫ Appear Offline", color: "#64748b" },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    statusMessage: user?.statusMessage || "",
    status: user?.status || "online",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/users/me/profile", form);
      setUser({ ...user, ...form });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await api.post("/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser({ ...user, avatar: data.avatar });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
          ← Back to chat
        </button>

        <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" }}>
          {/* Banner */}
          <div style={{ height: 100, background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />

          {/* Avatar section */}
          <div style={{ padding: "0 32px 32px", position: "relative" }}>
            <div style={{ position: "relative", display: "inline-block", marginTop: -40, marginBottom: 16 }}>
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                alt={user?.name}
                style={{ width: 80, height: 80, borderRadius: "50%", border: "4px solid #1e293b", objectFit: "cover", display: "block" }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#6366f1", border: "2px solid #1e293b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 12, color: "white",
                }}
                title="Change avatar"
              >
                {uploadingAvatar ? "⏳" : "✏️"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: "#f1f5f9", margin: "0 0 4px", fontSize: 22 }}>{user?.name}</h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>@{user?.username} · {user?.email}</p>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Display Name */}
              <div>
                <label style={labelStyle}>Display Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>

              {/* Bio */}
              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  maxLength={160}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Tell people about yourself..."
                />
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4, textAlign: "right" }}>{form.bio.length}/160</div>
              </div>

              {/* Status message */}
              <div>
                <label style={labelStyle}>Status Message</label>
                <input
                  value={form.statusMessage}
                  onChange={(e) => setForm({ ...form, statusMessage: e.target.value })}
                  style={inputStyle}
                  placeholder="What's on your mind?"
                  maxLength={80}
                />
              </div>

              {/* Status */}
              <div>
                <label style={labelStyle}>Presence</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {STATUS_OPTIONS.map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, status: value })}
                      style={{
                        padding: "8px 14px", borderRadius: 8, border: `1px solid ${form.status === value ? color : "#334155"}`,
                        background: form.status === value ? `${color}20` : "transparent",
                        color: form.status === value ? color : "#64748b",
                        cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={saving} style={{ ...btnStyle, flex: 1 }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={async () => { await logout(); navigate("/login"); }}
                  style={{ ...btnStyle, background: "#1e293b", border: "1px solid #ef4444", color: "#ef4444" }}
                >
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 };
const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const btnStyle = { background: "#6366f1", border: "none", borderRadius: 8, padding: "11px 20px", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };

export default ProfilePage;

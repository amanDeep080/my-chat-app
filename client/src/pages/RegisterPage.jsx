import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "", username: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.username.length < 3) return toast.error("Username must be at least 3 characters");
    const result = await register(form.email, form.password, form.username);
    if (result.success) { toast.success("Account created!"); navigate("/"); }
    else toast.error(result.error);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: 400, padding: 40, background: "#1e293b", borderRadius: 16, border: "1px solid #334155" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
          <h1 style={{ color: "#f1f5f9", margin: "0 0 4px", fontSize: 28 }}>Create Account</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Join ChatApp today</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="text" placeholder="Username" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s/g, "") })}
            required minLength={3} style={inputStyle} />
          <input type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required style={inputStyle} />
          <input type="password" placeholder="Password (min 6 chars)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required minLength={6} style={inputStyle} />
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#64748b", marginTop: 24, fontSize: 14 }}>
          Have an account? <Link to="/login" style={{ color: "#6366f1" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const inputStyle = {
  background: "#0f172a", border: "1px solid #334155", borderRadius: 8,
  padding: "12px 16px", color: "#f1f5f9", fontSize: 14, outline: "none",
  fontFamily: "inherit",
};

const btnStyle = {
  background: "#6366f1", border: "none", borderRadius: 8,
  padding: "12px 24px", color: "white", fontSize: 15, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
};

export default RegisterPage;

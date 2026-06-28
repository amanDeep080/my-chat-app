import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loading, error } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error(result.error);
    }
  };

  const handleGoogle = async () => {
    const result = await loginWithGoogle();
    if (result.success) { toast.success("Welcome!"); navigate("/"); }
    else toast.error(result.error);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0f172a", fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: 400, padding: 40, background: "#1e293b", borderRadius: 16, border: "1px solid #334155" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
          <h1 style={{ color: "#f1f5f9", margin: "0 0 4px", fontSize: 28 }}>ChatApp</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#334155" }} />
          <span style={{ color: "#475569", fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#334155" }} />
        </div>

        <button onClick={handleGoogle} disabled={loading} style={{ ...btnStyle, background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" }}>
          🔵 Continue with Google
        </button>

        <p style={{ textAlign: "center", color: "#64748b", marginTop: 24, fontSize: 14 }}>
          No account? <Link to="/register" style={{ color: "#6366f1" }}>Register</Link>
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

export default LoginPage;

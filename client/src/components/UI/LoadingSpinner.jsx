import React from "react";

const LoadingSpinner = ({ size = 40, message = "Loading..." }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "100vh", background: "#0f172a", gap: 16,
  }}>
    <div style={{
      width: size, height: size,
      border: `3px solid #1e293b`,
      borderTop: `3px solid #6366f1`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    {message && <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{message}</p>}
  </div>
);

export default LoadingSpinner;

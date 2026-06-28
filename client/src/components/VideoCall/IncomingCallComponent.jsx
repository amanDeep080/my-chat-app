import React from "react";
import { Phone, PhoneOff } from "lucide-react";

const IncomingCallComponent = ({ caller, callType = "video", onAccept, onReject }) => {
  if (!caller) return null;

  // Since caller might be just a UID string in some cases, let's handle it
  const displayName = typeof caller === 'object' ? (caller.name || caller.displayName || "Someone") : "Someone";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.9)", // slate-900 with opacity
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(8px)",
      animation: "fadeIn 0.3s ease-out"
    }}>
      <div style={{
        background: "#1e293b", // slate-800
        borderRadius: 24,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        padding: 40,
        textAlign: "center",
        width: "100%",
        maxWidth: 400,
        border: "1px solid #334155"
      }}>
        {/* Animated Ringing Effect */}
        <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 24px" }}>
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#6366f1",
            opacity: 0.2,
            animation: "pulse 2s infinite"
          }} />
          <div style={{
            position: "absolute",
            inset: 10,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }}>
            <span style={{ fontSize: 48, fontWeight: 700, color: "white" }}>
              {displayName[0]?.toUpperCase()}
            </span>
          </div>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: "0 0 8px" }}>
          {displayName}
        </h2>
        <p style={{ color: "#94a3b8", textTransform: "capitalize", margin: "0 0 32px", fontSize: 16 }}>
          Incoming {callType} call...
        </p>

        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          {/* Reject */}
          <button
            onClick={onReject}
            style={{
              background: "#ef4444",
              border: "none",
              borderRadius: "50%",
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
              transition: "transform 0.2s, background 0.2s",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = "#dc2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "#ef4444"; }}
            title="Decline"
          >
            <PhoneOff size={28} />
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            style={{
              background: "#22c55e",
              border: "none",
              borderRadius: "50%",
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
              transition: "transform 0.2s, background 0.2s",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = "#16a34a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "#22c55e"; }}
            title="Accept"
          >
            <Phone size={28} />
          </button>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: "#64748b" }}>
          Click the green button to join
        </p>
      </div>
    </div>
  );
};

export default IncomingCallComponent;

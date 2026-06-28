import React, { useEffect } from "react";
import useVideoCall from "../../hooks/useVideoCall";

const VideoCallModal = ({ targetUser, onClose, autoAnswer = false, incomingOffer = null }) => {
  const {
    callState, isAudioMuted, isVideoOff, isScreenSharing,
    localVideoRef, remoteVideoRef,
    startCall, answerCall, endCall, toggleAudio, toggleVideo, shareScreen,
  } = useVideoCall();

  useEffect(() => {
    if (autoAnswer && incomingOffer) {
      answerCall(incomingOffer);
    } else if (targetUser) {
      startCall(targetUser.uid, true);
    }
  }, []);

  const handleEnd = () => { endCall(); onClose(); };

  const statusLabel = {
    idle: "Connecting...",
    calling: `Calling ${targetUser?.name}...`,
    ringing: `Incoming call from ${targetUser?.name}`,
    connected: `Connected`,
    ended: "Call ended",
  }[callState] || "";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", zIndex: 200, fontFamily: "'Inter', sans-serif",
    }}>
      {/* Status */}
      <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>{statusLabel}</div>

      {/* Video area */}
      <div style={{ position: "relative", width: "min(700px, 90vw)", aspectRatio: "16/9", background: "#0f172a", borderRadius: 16, overflow: "hidden" }}>
        {/* Remote video */}
        <video ref={remoteVideoRef} autoPlay playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: callState === "connected" ? "block" : "none" }} />

        {/* Waiting state */}
        {callState !== "connected" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <img
              src={targetUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser?.username}`}
              alt={targetUser?.name}
              style={{ width: 100, height: 100, borderRadius: "50%", border: "4px solid #6366f1" }}
            />
            <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 600 }}>{targetUser?.name}</div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <video ref={localVideoRef} autoPlay playsInline muted
          style={{
            position: "absolute", bottom: 16, right: 16,
            width: 160, aspectRatio: "16/9", borderRadius: 8,
            objectFit: "cover", border: "2px solid #334155",
            display: isVideoOff ? "none" : "block",
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
        <ControlBtn onClick={toggleAudio} active={isAudioMuted} label={isAudioMuted ? "🔇" : "🎤"} title={isAudioMuted ? "Unmute" : "Mute"} />
        <ControlBtn onClick={toggleVideo} active={isVideoOff} label={isVideoOff ? "📷" : "📹"} title={isVideoOff ? "Start video" : "Stop video"} />
        <ControlBtn onClick={shareScreen} active={isScreenSharing} label="🖥️" title="Share screen" />
        <button
          onClick={handleEnd}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#ef4444", border: "none",
            color: "white", fontSize: 24, cursor: "pointer",
          }}
          title="End call"
        >
          📵
        </button>
      </div>

      {/* Answer / Decline for incoming calls */}
      {callState === "ringing" && !autoAnswer && (
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <button onClick={() => answerCall(incomingOffer)}
            style={{ padding: "12px 28px", background: "#22c55e", border: "none", borderRadius: 24, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            📞 Answer
          </button>
          <button onClick={handleEnd}
            style={{ padding: "12px 28px", background: "#ef4444", border: "none", borderRadius: 24, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            ✕ Decline
          </button>
        </div>
      )}
    </div>
  );
};

const ControlBtn = ({ onClick, active, label, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 56, height: 56, borderRadius: "50%",
      background: active ? "#334155" : "#1e293b",
      border: `1px solid ${active ? "#6366f1" : "#334155"}`,
      color: "white", fontSize: 22, cursor: "pointer",
      transition: "all 0.15s",
    }}
  >
    {label}
  </button>
);

export default VideoCallModal;

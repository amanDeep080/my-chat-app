import React, { useEffect, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";

const VideoCallComponent = ({
  callActive,
  callDuration,
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  localVideoRef,
  remoteVideoRef,
  onToggleAudio,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onEndCall,
  remoteUserName
}) => {
  const [durationDisplay, setDurationDisplay] = useState("00:00");

  useEffect(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    setDurationDisplay(
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    );
  }, [callDuration]);

  if (!callActive) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#0f172a",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Video Area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#020617" }}>
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        
        {/* Overlay Info */}
        <div style={{
          position: "absolute",
          top: 24,
          left: 24,
          background: "rgba(15, 23, 42, 0.75)",
          padding: "12px 20px",
          borderRadius: 16,
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: "white", fontSize: 16 }}>{remoteUserName || "Remote User"}</p>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s infinite" }} />
            {durationDisplay}
          </p>
        </div>

        {/* Local Video (PIP) */}
        <div style={{
          position: "absolute",
          bottom: 100,
          right: 24,
          width: 240,
          aspectRatio: "16/9",
          background: "#1e293b",
          borderRadius: 16,
          overflow: "hidden",
          border: "2px solid #334155",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          zIndex: 10
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />

          <div style={{ position: "absolute", bottom: 8, left: 12, color: "white", fontSize: 11, background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 4 }}>
            You
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{
        background: "#0f172a",
        padding: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        borderTop: "1px solid #1e293b"
      }}>
        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          style={{
            ...btnStyle,
            background: isAudioMuted ? "#ef4444" : "#334155",
          }}
          title={isAudioMuted ? "Unmute" : "Mute"}
        >
          {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          style={{
            ...btnStyle,
            background: isVideoOff ? "#ef4444" : "#334155",
          }}
          title={isVideoOff ? "Start Camera" : "Stop Camera"}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
          style={{
            ...btnStyle,
            background: isScreenSharing ? "#6366f1" : "#334155",
          }}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          <Monitor size={24} />
        </button>

        {/* Spacer */}
        <div style={{ width: 24 }} />

        {/* End Call */}
        <button
          onClick={onEndCall}
          style={{
            ...btnStyle,
            background: "#ef4444",
            width: 80,
            borderRadius: 20
          }}
          title="End Call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

const btnStyle = {
  border: "none",
  borderRadius: "50%",
  width: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  cursor: "pointer",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
};

export default VideoCallComponent;

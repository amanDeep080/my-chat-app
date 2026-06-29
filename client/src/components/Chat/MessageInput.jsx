import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useSocket } from "../../context/SocketContext";
import useChatStore from "../../store/chatStore";
import useTyping from "../../hooks/useTyping";
import api from "../../utils/api";
import toast from "react-hot-toast";

const MessageInput = ({ room }) => {
  const socket = useSocket();
  const { replyTo, clearReplyTo } = useChatStore();
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const { startTyping, stopTyping } = useTyping(room?.id);
  const inputRef = useRef(null);

  const sendMessage = useCallback((type = "text", fileData = null, msgContent = content) => {
    if (!room || !socket || (!msgContent.trim() && !fileData)) {
      if (!socket) toast.error("Socket disconnected. Please refresh to reconnect.");
      return;
    }

    socket.emit("message:send", {
      roomId: room.id,
      content: msgContent.trim() || (fileData?.name ?? ""),
      type,
      replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, senderName: replyTo.senderName } : null,
      fileData,
    });

    setContent("");
    clearReplyTo();
    stopTyping();
    inputRef.current?.focus();
  }, [room, content, replyTo, socket, stopTyping, clearReplyTo]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    startTyping();
  };

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    const toastId = toast.loading("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      const { data } = await api.post("/upload", formData);

      sendMessage(data.file.type, data.file, data.file.name);
      toast.success("File sent!", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  }, [sendMessage]);

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop, noClick: true, noKeyboard: true,
    accept: {
      "image/*": [],
      "video/*": [],
      "audio/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "application/vnd.ms-powerpoint": [],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [],
      "application/zip": [],
      "text/plain": [],
      "text/csv": [],
      "image/svg+xml": [],
    },
  });

  const QUICK_EMOJIS = ["😀", "👍", "❤️", "😂", "🎉", "🔥", "✅", "😮"];

  return (
    <div {...getRootProps()} style={{ padding: "12px 16px", borderTop: "1px solid #1e293b", position: "relative" }}>
      <input {...getInputProps()} />

      {isDragActive && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(99,102,241,0.1)",
          border: "2px dashed #6366f1", borderRadius: 8, display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 5, color: "#6366f1", fontSize: 16, fontWeight: 600,
        }}>
          Drop files to send
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
          background: "#1e293b", borderRadius: 8, marginBottom: 8,
          borderLeft: "3px solid #6366f1",
        }}>
          <span style={{ fontSize: 12, color: "#94a3b8", flex: 1 }}>
            ↩ Replying to <strong>{replyTo.senderName}</strong>: {replyTo.content?.slice(0, 60)}
          </span>
          <button onClick={clearReplyTo} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#1e293b", borderRadius: 12, padding: "8px 12px", border: "1px solid #334155" }}>
        {/* Attach file */}
        <button
          onClick={openFilePicker}
          disabled={uploading || !room || !socket}
          style={{ background: "transparent", border: "none", color: "#64748b", cursor: uploading || !room || !socket ? "not-allowed" : "pointer", fontSize: 20, padding: "2px 4px", flexShrink: 0 }}
          title="Attach file"
        >
          {uploading ? "⏳" : "📎"}
        </button>

        {/* Emoji */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, padding: "2px 4px" }}
            title="Emoji"
          >
            😄
          </button>
          {showEmoji && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, marginBottom: 8,
              background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
              padding: 8, display: "flex", gap: 4, zIndex: 20,
            }}>
              {QUICK_EMOJIS.map((e) => (
                <button key={e} onClick={() => { setContent((c) => c + e); setShowEmoji(false); inputRef.current?.focus(); }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 22, padding: 4 }}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${room?.type === "dm" ? "" : "#"}${room?.name || ""}...`}
          rows={1}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#f1f5f9", fontSize: 16, lineHeight: 1.6, resize: "none",
            fontFamily: "inherit", maxHeight: 120, overflowY: "auto",
          }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />

        {/* Send */}
        <button
          onClick={() => sendMessage()}
          disabled={!content.trim() || uploading || !room || !socket}
          style={{
            background: content.trim() && room && socket ? "#6366f1" : "#334155",
            border: "none", borderRadius: 8, padding: "8px 14px",
            color: "white", cursor: content.trim() && room && socket ? "pointer" : "default",
            fontSize: 16, flexShrink: 0, transition: "background 0.15s",
          }}
          title="Send (Enter)"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default MessageInput;

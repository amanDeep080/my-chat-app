import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";
import useMessages from "../../hooks/useMessages";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import { useSocket } from "../../context/SocketContext";
import useVideoCall from "../../hooks/useVideoCall";
import VideoCallComponent from "../VideoCall/VideoCallComponent";
import IncomingCallComponent from "../VideoCall/IncomingCallComponent";

const ChatWindow = ({ room }) => {
  const socket = useSocket();
  const { user } = useAuthStore();
  const { typingUsers, clearUnread, setRightPanel } = useChatStore();
  const { messages, loadMore, hasMore } = useMessages(room?.id);
  const bottomRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const {
    callState,
    callDuration,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  } = useVideoCall(socket);

  const getDMUser = () => room?.members?.find((m) => m.uid !== user?.uid);
  const isDM = room?.type === "dm" || room?.type === "direct" || room?.isDM;
  const dmUser = isDM ? getDMUser() : null;


  useEffect(() => {
    if (room?.id) {
      socket?.emit("room:join", room.id);
      clearUnread(room.id);
    }
    return () => socket?.emit("room:leave", room?.id);
  }, [room?.id, socket]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const roomTyping = (typingUsers[room?.id] || []).filter((uid) => uid !== user?.uid);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a" }}>
      <ChatHeader 
        room={room} 
        onStartAudioCall={() => startCall(dmUser?.uid, false, room.id)}
        onStartVideoCall={() => startCall(dmUser?.uid, true, room.id)}
        onCallHistory={() => setRightPanel("callHistory")}
      />

      {(callState === "connected" || callState === "calling" || callState === "ringing") && (
        <VideoCallComponent
          callActive={true}
          callDuration={callDuration}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onStartScreenShare={() => startScreenShare(dmUser?.uid)}
          onStopScreenShare={() => stopScreenShare(dmUser?.uid)}
          onEndCall={endCall}
          remoteUserName={dmUser?.name}
        />
      )}


      {incomingCall && (
        <IncomingCallComponent
          caller={incomingCall.from}
          callType={incomingCall.callType}
          onAccept={() => answerCall()}
          onReject={() => rejectCall(
            typeof incomingCall.from === 'object' ? incomingCall.from.uid : incomingCall.from,
            incomingCall.callId,
            "declined"
          )}
        />
      )}



      <div
        style={{ flex: 1, overflowY: "auto", padding: "0 0 8px 0" }}
        onScroll={(e) => {
          const el = e.currentTarget;
          // Load more when near top
          if (el.scrollTop < 100 && hasMore) loadMore();
          // Detect if user scrolled up
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
          setAutoScroll(atBottom);
        }}
      >
        <MessageList messages={messages} roomId={room?.id} />
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {roomTyping.length > 0 && (
        <div style={{ padding: "4px 20px", fontSize: 12, color: "#94a3b8", minHeight: 20 }}>
          {roomTyping.length === 1
            ? `Someone is typing...`
            : `${roomTyping.length} people are typing...`}
          <span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>●●●</span>
        </div>
      )}

      <MessageInput room={room} />
    </div>
  );
};

export default ChatWindow;

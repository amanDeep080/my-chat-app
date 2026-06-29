import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import RightPanel from "../components/Chat/RightPanel";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";

import useVideoCall from "../hooks/useVideoCall";
import VideoCallComponent from "../components/VideoCall/VideoCallComponent";
import IncomingCallComponent from "../components/VideoCall/IncomingCallComponent";

const ChatPage = () => {
  const { roomId } = useParams();
  const { rooms, setRooms, setActiveRoom, activeRoom, isSidebarOpen, rightPanel, toggleSidebar } = useChatStore();
  const { user } = useAuthStore();
  const socket = useSocket();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  const callHandlers = useVideoCall(socket);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      try {
        const { data } = await api.get("/rooms/my-rooms");
        setRooms(data.rooms);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    fetchRooms();
  }, [user, setRooms]);

  useEffect(() => {
    if (rooms.length > 0 && socket) {
      socket.emit("rooms:join", rooms.map((r) => r.id));
    }
  }, [rooms, socket]);

  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) setActiveRoom(room);
      if (isMobile && isSidebarOpen) toggleSidebar();
    } else if (rooms.length > 0 && !activeRoom && !isMobile) {
      setActiveRoom(rooms[0]);
    }
  }, [roomId, rooms, isMobile]);

  useEffect(() => {
    if (!socket) return;

    const handleNewRoom = async ({ roomId: newRoomId }) => {
      try {
        const { data } = await api.get(`/rooms/${newRoomId}`);
        useChatStore.getState().addRoom(data.room);
        socket.emit("room:join", newRoomId);
      } catch (err) {
        console.error("Failed to fetch new room:", err);
      }
    };

    socket.on("room:new", handleNewRoom);
    return () => {
      socket.off("room:new", handleNewRoom);
    };
  }, [socket]);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#0f172a",
      color: "#f1f5f9",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Sidebar - In Laptop mode it's on the left. In Phone mode it's the main screen if no room is active. */}
      <div style={{
        position: isMobile ? "absolute" : "relative",
        zIndex: 50,
        height: "100%",
        // If on mobile and a room is active, hide sidebar to the left. If no room is active, show sidebar.
        transform: isMobile && activeRoom ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        width: isMobile ? "100%" : 280,
        maxWidth: isMobile ? "none" : 320,
        background: "var(--bg-main)",
      }}>
        <Sidebar />
      </div>

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: "100%",
        // In Phone mode, slide the chat in from the right when a room is active
        position: isMobile ? "absolute" : "relative",
        inset: isMobile ? 0 : "auto",
        transform: isMobile && !activeRoom ? "translateX(100%)" : "translateX(0)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 40,
        background: "#0f172a"
      }}>
        {activeRoom ? (
          <ChatWindow room={activeRoom} callHandlers={callHandlers} />
        ) : !isMobile ? (
          <EmptyState />
        ) : null}
      </div>

      {/* Right Panel - Overlays everything on Mobile */}
      {rightPanel && (
        <div style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 60,
          width: isMobile ? "100%" : 300,
          height: "100%",
          background: "var(--bg-main)",
          boxShadow: "-4px 0 15px rgba(0,0,0,0.3)",
          transform: rightPanel ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}>
          <RightPanel
            room={activeRoom}
            panel={rightPanel}
            onStartCall={(uid, video) => {
              callHandlers.startCall(uid, video);
              useChatStore.getState().setRightPanel(null);
            }}
          />
        </div>
      )}

      {/* Global Call Overlays */}
      {(callHandlers.callState === "connected" || callHandlers.callState === "calling" || callHandlers.callState === "ringing") && (
        <VideoCallComponent
          callActive={true}
          callDuration={callHandlers.callDuration}
          isAudioMuted={callHandlers.isAudioMuted}
          isVideoOff={callHandlers.isVideoOff}
          isScreenSharing={callHandlers.isScreenSharing}
          localVideoRef={callHandlers.localVideoRef}
          remoteVideoRef={callHandlers.remoteVideoRef}
          onToggleAudio={callHandlers.toggleAudio}
          onToggleVideo={callHandlers.toggleVideo}
          onStartScreenShare={() => callHandlers.startScreenShare(callHandlers.remoteUid)}
          onStopScreenShare={() => callHandlers.stopScreenShare(callHandlers.remoteUid)}
          onEndCall={callHandlers.endCall}
          remoteUserName="Call" // Ideally fetch name from UID
        />
      )}

      {callHandlers.incomingCall && (
        <IncomingCallComponent
          caller={callHandlers.incomingCall.from}
          callType={callHandlers.incomingCall.callType}
          onAccept={() => callHandlers.answerCall()}
          onReject={() => callHandlers.rejectCall(
            typeof callHandlers.incomingCall.from === 'object' ? callHandlers.incomingCall.from.uid : callHandlers.incomingCall.from,
            callHandlers.incomingCall.callId,
            "declined"
          )}
        />
      )}
    </div>
  );
};

const EmptyState = () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
    <div style={{ fontSize: 64 }}>💬</div>
    <h2 style={{ color: "#94a3b8", fontWeight: 400 }}>Select a room to start chatting</h2>
  </div>
);

export default ChatPage;

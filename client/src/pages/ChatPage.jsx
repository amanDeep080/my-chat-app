import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import RightPanel from "../components/Chat/RightPanel";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";

const ChatPage = () => {
  const { roomId } = useParams();
  const { rooms, setRooms, setActiveRoom, activeRoom, isSidebarOpen, rightPanel } = useChatStore();
  const { user } = useAuthStore();
  const socket = useSocket();

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
    } else if (rooms.length > 0 && !activeRoom) {
      setActiveRoom(rooms[0]);
    }
  }, [roomId, rooms]);

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

    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
      {isSidebarOpen && <Sidebar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeRoom ? <ChatWindow room={activeRoom} /> : <EmptyState />}
      </div>
      {rightPanel && <RightPanel room={activeRoom} panel={rightPanel} />}
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

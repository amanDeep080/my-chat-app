import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { auth } from "../firebase/config";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const { token } = useAuthStore();
  const {
    addMessage, updateMessage, removeMessage,
    setTypingUsers, updatePresence, addRoom, updateRoom,
  } = useChatStore();

  useEffect(() => {
    if (!token) return;

    const connectSocket = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const freshToken = await currentUser.getIdToken();

      const newSocket = io(process.env.REACT_APP_SERVER_URL || "http://localhost:5001", {
        auth: { token: freshToken },
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("🟢 Socket connected");
      });

      newSocket.on("disconnect", () => {
        console.log("🔴 Socket disconnected");
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });

      newSocket.on("message:new", (message) => {
        addMessage(message.roomId, message);
        updateRoom(message.roomId, { lastMessage: { content: message.content, senderId: message.senderId, createdAt: message.createdAt } });
      });

      newSocket.on("message:updated", ({ messageId, ...updates }) => {
        const { messages } = useChatStore.getState();
        for (const roomId in messages) {
          const found = messages[roomId]?.find((m) => m.id === messageId);
          if (found) { updateMessage(roomId, messageId, updates); break; }
        }
      });

      newSocket.on("message:deleted", ({ messageId, roomId }) => {
        removeMessage(roomId, messageId);
      });

      newSocket.on("message:reaction_updated", ({ messageId, reactions }) => {
        const { messages } = useChatStore.getState();
        for (const roomId in messages) {
          const found = messages[roomId]?.find((m) => m.id === messageId);
          if (found) { updateMessage(roomId, messageId, { reactions }); break; }
        }
      });

      newSocket.on("typing:update", ({ roomId, typingUsers }) => {
        setTypingUsers(roomId, typingUsers);
      });

      newSocket.on("user:presence", ({ uid, status, lastSeen }) => {
        updatePresence(uid, { status, lastSeen });
      });

      newSocket.on("call:offer", ({ from, offer, roomId }) => {
        window.dispatchEvent(new CustomEvent("call:incoming", { detail: { from, offer, roomId } }));
      });

      newSocket.on("call:answer", ({ from, answer }) => {
        window.dispatchEvent(new CustomEvent("call:answer", { detail: { from, answer } }));
      });

      newSocket.on("call:ice_candidate", ({ from, candidate }) => {
        window.dispatchEvent(new CustomEvent("call:ice_candidate", { detail: { from, candidate } }));
      });

      newSocket.on("call:ended", ({ from }) => {
        window.dispatchEvent(new CustomEvent("call:ended", { detail: { from } }));
        toast("Call ended");
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;

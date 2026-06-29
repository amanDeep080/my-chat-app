import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { auth } from "../firebase/config";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const { token } = useAuthStore();

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

      newSocket.on("message:new", (message) => {
        const { addMessage, updateRoom } = useChatStore.getState();
        addMessage(message.roomId, message);
        updateRoom(message.roomId, {
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt
          }
        });
      });

      newSocket.on("message:updated", ({ messageId, content, edited }) => {
        const { messages, updateMessage } = useChatStore.getState();
        for (const roomId in messages) {
          const found = messages[roomId]?.find((m) => m.id === messageId);
          if (found) {
            updateMessage(roomId, messageId, { content, edited });
            break;
          }
        }
      });

      newSocket.on("message:deleted", ({ messageId, roomId }) => {
        const { removeMessage } = useChatStore.getState();
        removeMessage(roomId, messageId);
      });

      newSocket.on("message:reaction_updated", ({ messageId, reactions }) => {
        const { messages, updateMessage } = useChatStore.getState();
        for (const roomId in messages) {
          const found = messages[roomId]?.find((m) => m.id === messageId);
          if (found) {
            updateMessage(roomId, messageId, { reactions });
            break;
          }
        }
      });

      newSocket.on("typing:update", ({ roomId, typingUsers }) => {
        const { setTypingUsers } = useChatStore.getState();
        setTypingUsers(roomId, typingUsers);
      });

      newSocket.on("user:presence", ({ uid, status, lastSeen }) => {
        const { updatePresence } = useChatStore.getState();
        updatePresence(uid, { status, lastSeen });
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

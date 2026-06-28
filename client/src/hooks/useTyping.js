import { useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import useAuthStore from "../store/authStore";

const TYPING_TIMEOUT = 2000;

const useTyping = (roomId) => {
  const socket = useSocket();
  const { user } = useAuthStore();
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!socket || !roomId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", { roomId });
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", { roomId });
    }, TYPING_TIMEOUT);
  }, [socket, roomId]);

  const stopTyping = useCallback(() => {
    if (!socket || !roomId) return;
    clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("typing:stop", { roomId });
    }
  }, [socket, roomId]);

  return { startTyping, stopTyping };
};

export default useTyping;

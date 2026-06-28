import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";
import api from "../utils/api";

const PAGE_SIZE = 50;

const useMessages = (roomId) => {
  const { messages, setMessages } = useChatStore();
  const oldestMessageIdRef = useRef(null);
  const hasMoreRef = useRef(true);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const { data } = await api.get(`/messages/room/${roomId}?limit=${PAGE_SIZE}`);
      const msgs = data.messages || [];
      setMessages(roomId, msgs);
      oldestMessageIdRef.current = msgs.length > 0 ? msgs[0].id : null;
      hasMoreRef.current = data.hasMore;
    } catch (error) {
      console.error("Failed to load messages for room", roomId, error);
      toast.error("Could not load messages. Please refresh.");
      setMessages(roomId, []);
      hasMoreRef.current = false;
      oldestMessageIdRef.current = null;
    }
  }, [roomId, setMessages]);

  const { token } = useAuthStore();

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages, token]);

  const loadMore = useCallback(async () => {
    if (!roomId || !hasMoreRef.current || !oldestMessageIdRef.current) return;

    try {
      const { data } = await api.get(
        `/messages/room/${roomId}?limit=${PAGE_SIZE}&before=${oldestMessageIdRef.current}`
      );
      const older = data.messages || [];
      const current = useChatStore.getState().messages[roomId] || [];

      if (older.length > 0) {
        oldestMessageIdRef.current = older[0].id;
      }
      hasMoreRef.current = data.hasMore;
      setMessages(roomId, [...older, ...current]);
    } catch (error) {
      console.error("Failed to load older messages for room", roomId, error);
      hasMoreRef.current = false;
    }
  }, [roomId, setMessages]);

  const searchMessages = useCallback(async (query) => {
    const { data } = await api.get(`/messages/room/${roomId}/search?q=${encodeURIComponent(query)}`);
    return data.messages;
  }, [roomId]);

  return {
    messages: messages[roomId] || [],
    loadMore,
    hasMore: hasMoreRef.current,
    searchMessages,
  };
};

export default useMessages;

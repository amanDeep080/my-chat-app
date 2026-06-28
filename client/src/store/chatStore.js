import { create } from "zustand";

const useChatStore = create((set, get) => ({
  // Rooms
  rooms: [],
  activeRoom: null,
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (room) => set({ activeRoom: room }),
  addRoom: (room) => set((s) => ({ rooms: [room, ...s.rooms.filter((r) => r.id !== room.id)] })),
  updateRoom: (roomId, updates) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
      activeRoom: s.activeRoom?.id === roomId ? { ...s.activeRoom, ...updates } : s.activeRoom,
    })),

  // Messages
  messages: {},  // roomId -> messages[]
  setMessages: (roomId, messages) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: messages } })),
  addMessage: (roomId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...(s.messages[roomId] || []), message],
      },
    })),
  updateMessage: (roomId, messageId, updates) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),
  removeMessage: (roomId, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] || []).map((m) =>
          m.id === messageId ? { ...m, deleted: true, content: "This message was deleted" } : m
        ),
      },
    })),

  // Typing
  typingUsers: {},  // roomId -> uid[]
  setTypingUsers: (roomId, users) =>
    set((s) => ({ typingUsers: { ...s.typingUsers, [roomId]: users } })),

  // Presence
  onlineUsers: {},  // uid -> { status, lastSeen }
  updatePresence: (uid, data) =>
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [uid]: data } })),

  // Unread counts
  unreadCounts: {},
  incrementUnread: (roomId) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [roomId]: (s.unreadCounts[roomId] || 0) + 1 },
    })),
  clearUnread: (roomId) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [roomId]: 0 } })),

  // Reply to
  replyTo: null,
  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  // Search
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  // UI state
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  rightPanel: null, // 'members' | 'search' | 'pinned' | null
  setRightPanel: (panel) => set((s) => ({ rightPanel: s.rightPanel === panel ? null : panel })),
}));

export default useChatStore;

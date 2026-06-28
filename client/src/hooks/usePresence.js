import { useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import useChatStore from "../store/chatStore";
import axios from "axios";

// Track presence of specific users
const usePresence = (uids = [], token, userId, socket) => {
  const { updatePresence, onlineUsers } = useChatStore();
  const heartbeatIntervalRef = useRef(null);

  // Watch user presence
  useEffect(() => {
    if (!uids.length) return;

    const unsubs = uids.map((uid) => {
      const ref = doc(db, "users", uid);
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const { status, lastSeen, statusMessage } = snap.data();
          updatePresence(uid, { status, lastSeen, statusMessage });
        }
      });
    });

    return () => unsubs.forEach((u) => u());
  }, [uids.join(","), updatePresence]);

  // Set user status
  const setUserStatus = useCallback(
    async (status) => {
      try {
        await axios.post(
          `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/presence/status`,
          { status },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (socket) {
          socket.emit("presence:update", { status });
        }

        updatePresence(userId, { status });
      } catch (err) {
        console.error("Error updating status:", err);
      }
    },
    [socket, token, userId, updatePresence]
  );

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    try {
      if (socket) {
        socket.emit("heartbeat");
      }

      await axios.post(
        `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/presence/heartbeat`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error("Error sending heartbeat:", err);
    }
  }, [socket, token]);

  // Start heartbeat interval
  useEffect(() => {
    if (!socket || !token) return;

    sendHeartbeat();

    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [socket, token, sendHeartbeat]);

  // Set offline on unmount
  useEffect(() => {
    return () => {
      if (token && userId) {
        setUserStatus("offline");
      }
    };
  }, [setUserStatus, token, userId]);

  return { onlineUsers, setUserStatus, sendHeartbeat };
};

export default usePresence;

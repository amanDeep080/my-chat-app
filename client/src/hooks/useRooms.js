import { useEffect, useCallback } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import api from "../utils/api";

const useRooms = () => {
  const { user } = useAuthStore();
  const { rooms, setRooms, addRoom, updateRoom } = useChatStore();

  useEffect(() => {
    if (!user?.uid) return;

    // Real-time listener for user's rooms
    const q = query(
      collection(db, "rooms"),
      where("memberIds", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const updatedRooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRooms(updatedRooms);
    });

    return () => unsub();
  }, [user?.uid]);

  const createRoom = useCallback(async (roomData) => {
    const { data } = await api.post("/rooms", roomData);
    return data.room;
  }, []);

  const joinRoom = useCallback(async (roomId, inviteCode) => {
    const { data } = await api.post(`/rooms/${roomId}/join`, { inviteCode });
    return data.room;
  }, []);

  const leaveRoom = useCallback(async (roomId) => {
    await api.post(`/rooms/${roomId}/leave`);
  }, []);

  const createDM = useCallback(async (targetUid) => {
    const { data } = await api.post(`/users/dm/${targetUid}`);
    return data.room;
  }, []);

  return { rooms, createRoom, joinRoom, leaveRoom, createDM };
};

export default useRooms;

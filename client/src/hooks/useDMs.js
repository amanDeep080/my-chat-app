import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export const useDMs = (token) => {
  const [dms, setDms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch all DMs
  const fetchDMs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/dms/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDms(response.data);
    } catch (err) {
      console.error("Error fetching DMs:", err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create or get DM with user
  const createDMRoom = useCallback(
    async (otherUserId) => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/dms/create`,
          { otherUserId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data.roomId;
      } catch (err) {
        console.error("Error creating DM room:", err);
        toast.error("Failed to create DM");
        throw err;
      }
    },
    [token]
  );

  // Search users to DM
  const searchUsers = useCallback(
    async (query) => {
      try {
        setSearching(true);
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/dms/search?q=${query}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSearchResults(response.data);
      } catch (err) {
        console.error("Error searching users:", err);
        toast.error("Failed to search users");
      } finally {
        setSearching(false);
      }
    },
    [token]
  );

  // Delete DM
  const deleteDM = useCallback(
    async (roomId) => {
      try {
        await axios.delete(
          `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/dms/${roomId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDms((prev) => prev.filter((dm) => dm.roomId !== roomId));
        toast.success("DM deleted");
      } catch (err) {
        console.error("Error deleting DM:", err);
        toast.error("Failed to delete DM");
      }
    },
    [token]
  );

  return {
    dms,
    loading,
    searchResults,
    searching,
    fetchDMs,
    createDMRoom,
    searchUsers,
    deleteDM,
  };
};

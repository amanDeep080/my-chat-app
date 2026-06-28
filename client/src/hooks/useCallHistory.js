import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export const useCallHistory = (token) => {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch call history
  const fetchCallHistory = useCallback(
    async (limit = 50) => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/calls?limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCallHistory(response.data);
      } catch (err) {
        console.error("Error fetching call history:", err);
        toast.error("Failed to load call history");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Fetch call history with specific user
  const fetchCallHistoryWithUser = useCallback(
    async (otherUserId) => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/calls/${otherUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (err) {
        console.error("Error fetching call history with user:", err);
        toast.error("Failed to load call history");
        return [];
      }
    },
    [token]
  );

  // Delete call record
  const deleteCallRecord = useCallback(
    async (callId) => {
      try {
        await axios.delete(
          `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/calls/${callId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCallHistory((prev) => prev.filter((call) => call.callId !== callId));
        toast.success("Call record deleted");
      } catch (err) {
        console.error("Error deleting call record:", err);
        toast.error("Failed to delete call record");
      }
    },
    [token]
  );

  return {
    callHistory,
    loading,
    fetchCallHistory,
    fetchCallHistoryWithUser,
    deleteCallRecord,
  };
};

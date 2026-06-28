import React, { useEffect, useState } from "react";
import { useDMs } from "../hooks/useDMs";
import useAuthStore from "../store/authStore";
import { Search, MessageSquare, Trash2 } from "lucide-react";

const DirectMessagesPanel = ({ onSelectDM, selectedDM }) => {
  const { token } = useAuthStore();
  const { dms, loading, searchResults, searching, fetchDMs, searchUsers, createDMRoom, deleteDM } = useDMs(token);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchDMs();
  }, [fetchDMs]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      searchUsers(query);
    } else {
      setSearchQuery("");
    }
  };

  const handleStartDM = async (userId) => {
    try {
      const roomId = await createDMRoom(userId);
      onSelectDM(roomId);
      setSearchQuery("");
      setShowSearch(false);
      fetchDMs();
    } catch (err) {
      console.error("Error starting DM:", err);
    }
  };

  return (
    <div className="bg-slate-800 border-r border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white mb-3">Direct Messages</h2>
        
        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-full px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition flex items-center gap-2"
        >
          <Search size={16} />
          New Message
        </button>
      </div>

      {/* Search / New DM */}
      {showSearch && (
        <div className="p-4 border-b border-slate-700">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          
          {searching && (
            <p className="text-xs text-slate-400 mt-2">Searching...</p>
          )}
          
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {searchResults.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => handleStartDM(user.uid)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {user.displayName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DM List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            Loading...
          </div>
        ) : dms.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            No direct messages yet
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {dms.map((dm) => (
              <div
                key={dm.roomId}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition group ${
                  selectedDM === dm.roomId
                    ? "bg-slate-600"
                    : "hover:bg-slate-700"
                }`}
                onClick={() => onSelectDM(dm.roomId)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {dm.otherUser?.displayName?.[0] || "?"}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {dm.otherUser?.displayName || "Unknown"}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {dm.lastMessage?.content || "No messages yet"}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDM(dm.roomId);
                  }}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white transition opacity-0 group-hover:opacity-100"
                  title="Delete DM"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessagesPanel;

const express = require("express");
const router = express.Router();
const { createDMRoom, getDMsForUser, searchDMs, deleteDMRoom } = require("../services/dm");
const { verifyToken } = require("../middleware/auth");

// Create or get DM room
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user.uid;

    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId is required" });
    }

    const { roomId, isNew } = await createDMRoom(userId, otherUserId);

    if (isNew) {
      const io = req.app.get("io");
      io.to(otherUserId).emit("room:new", { roomId });
    }

    res.json({ roomId, isNew });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all DMs for user
router.get("/list", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const dms = await getDMsForUser(userId);
    res.json(dms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search for users to DM
router.get("/search", verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.uid;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: "Query must be at least 2 characters" });
    }

    const results = await searchDMs(userId, q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete DM room
router.delete("/:roomId", verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.uid;

    await deleteDMRoom(roomId, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

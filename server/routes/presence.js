const express = require("express");
const router = express.Router();
const { updateUserPresence, getUserPresence, getAllPresence, recordHeartbeat } = require("../services/presence");
const { verifyToken } = require("../middleware/auth");

// Update user presence/status
router.post("/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.uid;

    if (!["online", "away", "busy", "offline"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const presenceData = await updateUserPresence(userId, status);
    res.json(presenceData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's presence
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const presenceData = await getUserPresence(userId);
    res.json(presenceData || { uid: userId, status: "offline" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users' presence
router.get("/all", async (req, res) => {
  try {
    const presence = await getAllPresence();
    res.json(presence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record heartbeat (keep-alive)
router.post("/heartbeat", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    await recordHeartbeat(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

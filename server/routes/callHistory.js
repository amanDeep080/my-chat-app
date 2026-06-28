const express = require("express");
const router = express.Router();
const { getCallHistory, getCallHistoryWithUser, deleteCallRecord } = require("../services/callHistory");
const { verifyToken } = require("../middleware/auth");

// Get call history for user
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 50 } = req.query;
    const history = await getCallHistory(userId, parseInt(limit));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get call history with specific user
router.get("/:otherUserId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { otherUserId } = req.params;
    const history = await getCallHistoryWithUser(userId, otherUserId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete call record
router.delete("/:callId", verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    await deleteCallRecord(callId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

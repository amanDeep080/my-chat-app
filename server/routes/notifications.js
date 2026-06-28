const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDb } = require("../services/firebase");

// Get user notifications
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection("notifications")
      .where("uid", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    await db.collection("notifications").doc(req.params.id).update({ read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection("notifications")
      .where("uid", "==", req.user.uid)
      .where("read", "==", false)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDb } = require("../services/firebase");

// Get messages for a room with pagination
router.get("/room/:roomId", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    let snapshot;
    try {
      // Primary attempt: use index-optimized query
      let query = db
        .collection("messages")
        .where("roomId", "==", roomId)
        .orderBy("createdAt", "desc")
        .limit(Number(limit));

      if (before) {
        const beforeDoc = await db.collection("messages").doc(before).get();
        if (beforeDoc.exists) query = query.startAfter(beforeDoc);
      }
      snapshot = await query.get();
    } catch (e) {
      console.warn("Falling back to non-indexed query for messages. Please create the suggested Firestore index.");
      // Fallback: fetch without orderBy (may require manual sorting)
      // This allows the app to work even if the composite index is missing
      let query = db
        .collection("messages")
        .where("roomId", "==", roomId)
        .limit(Number(limit) * 2); // Fetch more to increase chances of getting latest

      snapshot = await query.get();
    }

    let messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Ensure they are sorted by date
    messages.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    // Limit to requested number and reverse for chronological display
    const result = messages.slice(0, Number(limit)).reverse();

    res.json({ messages: result, hasMore: messages.length >= Number(limit) });
  } catch (error) {
    console.error("Messages route error:", error);
    res.status(500).json({ error: error.message });
  }
});


// Search messages in a room
router.get("/room/:roomId/search", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { roomId } = req.params;
    const { q } = req.query;

    if (!q) return res.status(400).json({ error: "Search query required" });

    let snapshot;
    try {
      snapshot = await db
        .collection("messages")
        .where("roomId", "==", roomId)
        .where("type", "==", "text")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
    } catch (e) {
      snapshot = await db
        .collection("messages")
        .where("roomId", "==", roomId)
        .where("type", "==", "text")
        .limit(100)
        .get();
    }

    let messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filter and sort manually
    const filtered = messages
      .filter((m) => m.content?.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });

    res.json({ messages: filtered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get a specific message
router.get("/:messageId", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection("messages").doc(req.params.messageId).get();
    if (!doc.exists) return res.status(404).json({ error: "Message not found" });
    res.json({ message: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forward a message
router.post("/:messageId/forward", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { targetRoomId } = req.body;
    const { uid, name } = req.user;

    const originalDoc = await db.collection("messages").doc(req.params.messageId).get();
    if (!originalDoc.exists) return res.status(404).json({ error: "Message not found" });

    const original = originalDoc.data();
    const forwarded = {
      ...original,
      roomId: targetRoomId,
      senderId: uid,
      senderName: name,
      forwarded: true,
      originalSender: original.senderName,
      createdAt: new Date(),
      updatedAt: new Date(),
      readBy: [{ uid, readAt: new Date() }],
    };

    const ref = await db.collection("messages").add(forwarded);
    res.status(201).json({ message: { id: ref.id, ...forwarded } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookmark a message
router.post("/:messageId/bookmark", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const admin = require("firebase-admin");
    await db.collection("users").doc(req.user.uid).update({
      bookmarks: admin.firestore.FieldValue.arrayUnion(req.params.messageId),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bookmarked messages
router.get("/user/bookmarks", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const { bookmarks = [] } = userDoc.data();

    if (bookmarks.length === 0) return res.json({ messages: [] });

    const messages = await Promise.all(
      bookmarks.map(async (id) => {
        const doc = await db.collection("messages").doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
      })
    );

    res.json({ messages: messages.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Report a message
router.post("/:messageId/report", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { reason } = req.body;
    const { uid } = req.user;

    await db.collection("reports").add({
      messageId: req.params.messageId,
      reportedBy: uid,
      reason: reason || "No reason provided",
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


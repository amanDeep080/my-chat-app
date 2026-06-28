const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDb } = require("../services/firebase");

// Search users
router.get("/search", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query required" });

    const snapshot = await db.collection("users")
      .where("username", ">=", q)
      .where("username", "<=", q + "\uf8ff")
      .limit(10)
      .get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { uid: doc.id, username: data.username, name: data.name, avatar: data.avatar, status: data.status };
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get("/:uid", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });

    const data = doc.data();
    const { fcmToken, ...publicData } = data; // never expose FCM token
    res.json({ user: { uid: doc.id, ...publicData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update own profile
router.put("/me/profile", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { name, bio, statusMessage, status } = req.body;
    const allowed = ["online", "away", "busy", "offline"];

    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (statusMessage !== undefined) updates.statusMessage = statusMessage;
    if (status && allowed.includes(status)) updates.status = status;

    await db.collection("users").doc(req.user.uid).update(updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get or create DM room between two users
router.post("/dm/:targetUid", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { uid } = req.user;
    const { targetUid } = req.params;

    const members = [uid, targetUid].sort();
    const dmId = `dm_${members.join("_")}`;

    const dmDoc = await db.collection("rooms").doc(dmId).get();
    if (dmDoc.exists) return res.json({ room: { id: dmId, ...dmDoc.data() } });

    const targetUser = await db.collection("users").doc(targetUid).get();
    const currentUser = await db.collection("users").doc(uid).get();

    const dmData = {
      type: "dm",
      memberIds: members,
      members: [currentUser.data(), targetUser.data()],
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("rooms").doc(dmId).set(dmData);

    for (const memberId of members) {
      await db.collection("users").doc(memberId).update({
        rooms: require("firebase-admin").firestore.FieldValue.arrayUnion(dmId),
      });
    }

    res.status(201).json({ room: { id: dmId, ...dmData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

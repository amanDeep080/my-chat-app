const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDb, getAuth } = require("../services/firebase");

// Register / sync user after Firebase Auth signup
router.post("/register", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { uid, email, name } = req.user;
    const { username, avatar } = req.body;

    // Check username uniqueness
    const usernameSnap = await db.collection("users").where("username", "==", username).get();
    if (!usernameSnap.empty) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const userData = {
      uid,
      email,
      name: name || username,
      username,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: "",
      status: "online",
      statusMessage: "",
      lastSeen: new Date(),
      fcmToken: null,
      rooms: [],
      createdAt: new Date(),
    };

    await db.collection("users").doc(uid).set(userData);
    res.status(201).json({ user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: { id: userDoc.id, ...userDoc.data() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update FCM token for push notifications
router.post("/fcm-token", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { fcmToken } = req.body;
    await db.collection("users").doc(req.user.uid).update({ fcmToken });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDb } = require("../services/firebase");

// Middleware to check if user is a global admin
const isGlobalAdmin = async (req, res, next) => {
  try {
    const db = getDb();
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.get("/stats", verifyToken, isGlobalAdmin, async (req, res) => {
  try {
    const db = getDb();
    const usersCount = (await db.collection("users").count().get()).data().count;
    const roomsCount = (await db.collection("rooms").count().get()).data().count;
    const reportsCount = (await db.collection("reports").count().get()).data().count;

    res.json({ usersCount, roomsCount, reportsCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/reports", verifyToken, isGlobalAdmin, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection("reports").orderBy("createdAt", "desc").get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

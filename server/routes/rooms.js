const express = require("express");
const router = express.Router();
const { verifyToken, isRoomAdmin } = require("../middleware/auth");
const { getDb } = require("../services/firebase");
const { v4: uuidv4 } = require("uuid");

// Get all public rooms
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { search, limit = 20 } = req.query;
    let query = db.collection("rooms").where("type", "==", "public").limit(Number(limit));

    const snapshot = await query.get();
    const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const filtered = rooms.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
      );
      return res.json({ rooms: filtered });
    }

    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's joined rooms
router.get("/my-rooms", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("rooms")
      .where("memberIds", "array-contains", req.user.uid)
      .get();

    const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Sort manually if orderBy is failing due to index or type mismatch
    rooms.sort((a, b) => (b.updatedAt?.toDate?.() || 0) - (a.updatedAt?.toDate?.() || 0));

    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Create a room
router.post("/", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { name, description, type = "public", memberIds = [] } = req.body;
    const { uid, name: userName } = req.user;

    if (type === "group_dm" && memberIds.length > 10) {
      return res.status(400).json({ error: "Group DMs are limited to 10 members" });
    }

    const inviteCode = uuidv4().slice(0, 8).toUpperCase();

    const allMemberIds = [...new Set([uid, ...memberIds])];

    const members = await Promise.all(
      allMemberIds.map(async (memberId) => {
        const userDoc = await db.collection("users").doc(memberId).get();
        return {
          uid: memberId,
          role: memberId === uid ? "owner" : "member",
          joinedAt: new Date(),
          ...userDoc.data(),
        };
      })
    );

    const roomData = {
      name,
      description: description || "",
      type,
      inviteCode,
      createdBy: uid,
      memberIds: allMemberIds,
      members,
      lastMessage: null,
      pinnedMessages: [],
      topic: "",
      banner: null,
      muted: [],
      banned: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const roomRef = await db.collection("rooms").add(roomData);

    // Add room to each user's room list
    const io = req.app.get("io");
    for (const memberId of allMemberIds) {
      await db.collection("users").doc(memberId).update({
        rooms: require("firebase-admin").firestore.FieldValue.arrayUnion(roomRef.id),
      });

      // Notify member if online
      if (memberId !== uid) {
        io.to(memberId).emit("room:new", { roomId: roomRef.id });
      }
    }


    res.status(201).json({ room: { id: roomRef.id, ...roomData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get room by ID
router.get("/:roomId", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection("rooms").doc(req.params.roomId).get();
    if (!doc.exists) return res.status(404).json({ error: "Room not found" });

    const room = { id: doc.id, ...doc.data() };

    if (room.type === "private" && !room.memberIds.includes(req.user.uid)) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join a room
router.post("/:roomId/join", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { roomId } = req.params;
    const { uid } = req.user;
    const { inviteCode } = req.body;

    const roomDoc = await db.collection("rooms").doc(roomId).get();
    if (!roomDoc.exists) return res.status(404).json({ error: "Room not found" });

    const room = roomDoc.data();

    if (room.banned?.includes(uid)) return res.status(403).json({ error: "You are banned from this room" });
    if (room.memberIds?.includes(uid)) return res.status(400).json({ error: "Already a member" });
    if (room.type === "private" && room.inviteCode !== inviteCode) {
      return res.status(403).json({ error: "Invalid invite code" });
    }

    const userDoc = await db.collection("users").doc(uid).get();
    const newMember = { uid, role: "member", joinedAt: new Date(), ...userDoc.data() };

    await db.collection("rooms").doc(roomId).update({
      memberIds: require("firebase-admin").firestore.FieldValue.arrayUnion(uid),
      members: require("firebase-admin").firestore.FieldValue.arrayUnion(newMember),
      updatedAt: new Date(),
    });

    await db.collection("users").doc(uid).update({
      rooms: require("firebase-admin").firestore.FieldValue.arrayUnion(roomId),
    });

    res.json({ success: true, room: { id: roomId, ...room } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update room (admin only)
router.put("/:roomId", verifyToken, isRoomAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { name, description, topic, banner } = req.body;
    await db.collection("rooms").doc(req.params.roomId).update({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(topic !== undefined && { topic }),
      ...(banner !== undefined && { banner }),
      updatedAt: new Date(),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kick / ban member (admin)
router.post("/:roomId/moderate", verifyToken, isRoomAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { targetUid, action } = req.body; // action: kick | ban | mute | promote
    const admin = require("firebase-admin");

    const updates = {};
    if (action === "kick" || action === "ban") {
      updates.memberIds = admin.firestore.FieldValue.arrayRemove(targetUid);
      if (action === "ban") {
        updates.banned = admin.firestore.FieldValue.arrayUnion(targetUid);
      }
    } else if (action === "mute") {
      updates.muted = admin.firestore.FieldValue.arrayUnion(targetUid);
    }

    await db.collection("rooms").doc(req.params.roomId).update(updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pin a message
router.post("/:roomId/pin/:messageId", verifyToken, isRoomAdmin, async (req, res) => {
  try {
    const db = getDb();
    const admin = require("firebase-admin");
    await db.collection("rooms").doc(req.params.roomId).update({
      pinnedMessages: admin.firestore.FieldValue.arrayUnion(req.params.messageId),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave a room
router.post("/:roomId/leave", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const admin = require("firebase-admin");
    const { roomId } = req.params;
    const { uid } = req.user;

    const roomRef = db.collection("rooms").doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: "Room not found" });

    const room = roomDoc.data();
    if (room.createdBy === uid) {
      return res.status(400).json({ error: "Owners cannot leave. Delete the room instead." });
    }

    await roomRef.update({
      memberIds: admin.firestore.FieldValue.arrayRemove(uid),
      members: room.members.filter(m => m.uid !== uid),
    });

    await db.collection("users").doc(uid).update({
      rooms: admin.firestore.FieldValue.arrayRemove(roomId),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle mute room
router.post("/:roomId/toggle-mute", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const admin = require("firebase-admin");
    const { roomId } = req.params;
    const { uid } = req.user;

    const roomRef = db.collection("rooms").doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: "Room not found" });

    const { muted = [] } = roomDoc.data();
    const isMuted = muted.includes(uid);

    await roomRef.update({
      muted: isMuted ? admin.firestore.FieldValue.arrayRemove(uid) : admin.firestore.FieldValue.arrayUnion(uid),
    });

    res.json({ success: true, muted: !isMuted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Archive room (admin only)
router.post("/:roomId/archive", verifyToken, isRoomAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { archived = true } = req.body;
    await db.collection("rooms").doc(req.params.roomId).update({ archived, updatedAt: new Date() });
    res.json({ success: true, archived });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member settings (mute, notification preferences)
router.put("/:roomId/member-settings", verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { roomId } = req.params;
    const { uid } = req.user;
    const { notificationPreference } = req.body; // 'all' | 'mentions' | 'mute'

    const roomRef = db.collection("rooms").doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: "Room not found" });

    const room = roomDoc.data();
    const members = room.members.map(m =>
      m.uid === uid ? { ...m, notificationPreference } : m
    );

    await roomRef.update({ members });
    res.json({ success: true, notificationPreference });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



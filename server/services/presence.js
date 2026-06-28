const { getDb } = require("./firebase");

const PRESENCE_TIMEOUT = 30000; // 30 seconds
const userHeartbeats = new Map(); // uid -> lastHeartbeat

const updateUserPresence = async (uid, status, userDetails = {}) => {
  try {
    const db = getDb();
    const presenceData = {
      uid,
      status, // "online", "away", "busy", "offline"
      lastSeen: new Date(),
      updatedAt: new Date(),
      ...userDetails,
    };

    await db.collection("presence").doc(uid).set(presenceData, { merge: true });
    userHeartbeats.set(uid, Date.now());
    return presenceData;
  } catch (err) {
    console.error("Error updating presence:", err);
  }
};

const getUserPresence = async (uid) => {
  try {
    const db = getDb();
    const doc = await db.collection("presence").doc(uid).get();
    return doc.exists ? doc.data() : null;
  } catch (err) {
    console.error("Error getting presence:", err);
    return null;
  }
};

const getAllPresence = async () => {
  try {
    const db = getDb();
    const snapshot = await db.collection("presence").get();
    const presence = {};
    snapshot.forEach((doc) => {
      presence[doc.id] = doc.data();
    });
    return presence;
  } catch (err) {
    console.error("Error getting all presence:", err);
    return {};
  }
};

const recordHeartbeat = async (uid) => {
  try {
    const db = getDb();
    await db.collection("presence").doc(uid).update({
      lastHeartbeat: new Date(),
      updatedAt: new Date(),
    });
    userHeartbeats.set(uid, Date.now());
  } catch (err) {
    console.error("Error recording heartbeat:", err);
  }
};

const cleanupInactiveUsers = async (timeoutMs = PRESENCE_TIMEOUT) => {
  try {
    const now = Date.now();
    const db = getDb();
    const snapshot = await db.collection("presence").get();

    const updates = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.lastHeartbeat) {
        const lastHeartbeat = data.lastHeartbeat.toMillis?.() || data.lastHeartbeat;
        if (now - lastHeartbeat > timeoutMs && data.status === "online") {
          updates.push(
            db.collection("presence").doc(doc.id).update({
              status: "offline",
              lastSeen: new Date(),
            })
          );
        }
      }
    });

    await Promise.all(updates);
  } catch (err) {
    console.error("Error cleaning up inactive users:", err);
  }
};

module.exports = {
  updateUserPresence,
  getUserPresence,
  getAllPresence,
  recordHeartbeat,
  cleanupInactiveUsers,
};

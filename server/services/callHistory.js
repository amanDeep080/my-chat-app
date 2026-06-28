const { getDb } = require("./firebase");
const { v4: uuidv4 } = require("uuid");

const recordCall = async (initiatorId, recipientId, type = "audio", duration = 0, status = "completed") => {
  try {
    const db = getDb();
    const callId = uuidv4();

    const callData = {
      callId,
      initiatorId,
      recipientId,
      type, // "audio", "video", "screen"
      duration, // in seconds
      status, // "completed", "missed", "declined", "failed"
      startedAt: new Date(),
      endedAt: new Date(Date.now() + duration * 1000),
      createdAt: new Date(),
    };

    await db.collection("callHistory").doc(callId).set(callData);
    return callData;
  } catch (err) {
    console.error("Error recording call:", err);
    throw err;
  }
};

const getCallHistory = async (userId, limit = 50) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("callHistory")
      .where("recipientId", "==", userId)
      .orderBy("startedAt", "desc")
      .limit(limit)
      .get();

    const calls = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userDoc = await db.collection("users").doc(data.initiatorId).get();
      calls.push({
        ...data,
        initiatorDetails: userDoc.exists ? userDoc.data() : { uid: data.initiatorId },
      });
    }

    return calls;
  } catch (err) {
    console.error("Error getting call history:", err);
    return [];
  }
};

const getCallHistoryWithUser = async (userId, otherUserId) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("callHistory")
      .where("initiatorId", "in", [userId, otherUserId])
      .where("recipientId", "in", [userId, otherUserId])
      .orderBy("startedAt", "desc")
      .limit(20)
      .get();

    const calls = [];
    snapshot.forEach((doc) => {
      calls.push(doc.data());
    });

    return calls;
  } catch (err) {
    console.error("Error getting call history with user:", err);
    return [];
  }
};

const deleteCallRecord = async (callId) => {
  try {
    const db = getDb();
    await db.collection("callHistory").doc(callId).delete();
    return true;
  } catch (err) {
    console.error("Error deleting call record:", err);
    throw err;
  }
};

module.exports = {
  recordCall,
  getCallHistory,
  getCallHistoryWithUser,
  deleteCallRecord,
};

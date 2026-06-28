const { getDb } = require("./firebase");
const { v4: uuidv4 } = require("uuid");

const createDMRoom = async (user1Id, user2Id) => {
  try {
    const db = getDb();
    const dmRoomId = `dm_${[user1Id, user2Id].sort().join("_")}`;

    // Check if DM already exists
    const existing = await db.collection("rooms").doc(dmRoomId).get();
    if (existing.exists) {
      return { roomId: dmRoomId, isNew: false };
    }

    // Get user profiles to include in members list
    const [u1Doc, u2Doc] = await Promise.all([
      db.collection("users").doc(user1Id).get(),
      db.collection("users").doc(user2Id).get()
    ]);

    if (!u1Doc.exists || !u2Doc.exists) {
      throw new Error("One or both users not found");
    }

    const u1 = u1Doc.data();
    const u2 = u2Doc.data();

    // Create new DM room compatible with frontend expectations
    const dmRoom = {
      name: `${u1.name}, ${u2.name}`,
      type: "dm",
      memberIds: [user1Id, user2Id],
      members: [
        { uid: user1Id, name: u1.name, username: u1.username, avatar: u1.avatar, role: "member" },
        { uid: user2Id, name: u2.name, username: u2.username, avatar: u2.avatar, role: "member" }
      ],
      isDM: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      pinnedMessages: [],
      muted: [],
      archived: false
    };

    await db.collection("rooms").doc(dmRoomId).set(dmRoom);

    // Add to users' room lists
    await Promise.all([
      db.collection("users").doc(user1Id).update({
        rooms: require("firebase-admin").firestore.FieldValue.arrayUnion(dmRoomId)
      }),
      db.collection("users").doc(user2Id).update({
        rooms: require("firebase-admin").firestore.FieldValue.arrayUnion(dmRoomId)
      })
    ]);

    return { roomId: dmRoomId, isNew: true };
  } catch (err) {
    console.error("Error creating DM room:", err);
    throw err;
  }
};


const getDMsForUser = async (userId) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("rooms")
      .where("isDM", "==", true)
      .where("memberIds", "array-contains", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const dms = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const otherUserId = data.memberIds.find((id) => id !== userId);

      // Get other user's profile
      const userDoc = await db.collection("users").doc(otherUserId).get();
      const userData = userDoc.exists ? userDoc.data() : { uid: otherUserId };

      dms.push({
        id: doc.id,
        ...data,
        otherUser: userData,
      });
    }

    return dms;
  } catch (err) {
    console.error("Error getting DMs:", err);
    return [];
  }
};


const searchDMs = async (userId, query) => {
  try {
    const db = getDb();
    // In our current schema, we use 'username' or 'name', not 'displayName'
    const usersSnapshot = await db
      .collection("users")
      .where("username", ">=", query.toLowerCase())
      .where("username", "<=", query.toLowerCase() + "\uf8ff")
      .limit(10)
      .get();

    const results = [];
    for (const doc of usersSnapshot.docs) {
      if (doc.id !== userId) {
        const data = doc.data();
        results.push({
          uid: doc.id,
          name: data.name,
          username: data.username,
          avatar: data.avatar,
          status: data.status || "offline",
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Error searching DMs:", err);
    return [];
  }
};


const deleteDMRoom = async (roomId, userId) => {
  try {
    const db = getDb();
    const roomDoc = await db.collection("rooms").doc(roomId).get();

    if (!roomDoc.exists || !roomDoc.data().isDM) {
      throw new Error("Room not found or is not a DM");
    }

    if (!roomDoc.data().memberIds.includes(userId)) {
      throw new Error("Unauthorized");
    }

    await db.collection("rooms").doc(roomId).delete();
    return true;
  } catch (err) {
    console.error("Error deleting DM room:", err);
    throw err;
  }
};


module.exports = {
  createDMRoom,
  getDMsForUser,
  searchDMs,
  deleteDMRoom,
};

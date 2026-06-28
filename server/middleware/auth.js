const { getAuth } = require("../services/firebase");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const isRoomAdmin = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { uid } = req.user;
    const { getDb } = require("../services/firebase");
    const db = getDb();

    const roomDoc = await db.collection("rooms").doc(roomId).get();
    if (!roomDoc.exists) return res.status(404).json({ error: "Room not found" });

    const room = roomDoc.data();
    const member = room.members?.find((m) => m.uid === uid);

    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    req.room = room;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyToken, isRoomAdmin };

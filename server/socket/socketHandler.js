const { getDb, getAuth } = require("../services/firebase");
const { sendPushNotification } = require("../services/notification");
const { updateUserPresence, recordHeartbeat } = require("../services/presence");
const { recordCall } = require("../services/callHistory");

const connectedUsers = new Map(); // uid -> socketId
const typingUsers = new Map();    // roomId -> Set of uids
const activeCallSessions = new Map(); // callId -> { initiator, recipient, startTime }

const Filter = require("bad-words");
const filter = new Filter();

const initSocket = (io) => {
  // Authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = await getAuth().verifyIdToken(token);
      socket.uid = decoded.uid;
      socket.userName = decoded.name || decoded.email;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const { uid } = socket;
    console.log(`✅ User connected: ${uid}`);

    socket.join(uid); // Join personal room for notifications
    connectedUsers.set(uid, socket.id);

    await updateUserPresence(uid, "online", { socketId: socket.id });
    io.emit("user:presence", { uid, status: "online", lastSeen: new Date() });

    // ── Heartbeat (keep-alive) ──────────────────────────────────
    socket.on("heartbeat", async () => {
      await recordHeartbeat(uid);
    });

    // ── Join rooms ──────────────────────────────────────────────
    socket.on("rooms:join", async (roomIds) => {
      roomIds.forEach((roomId) => {
        socket.join(roomId);
        broadcastMemberCount(roomId);
      });
    });

    socket.on("room:join", (roomId) => {
      socket.join(roomId);
      broadcastMemberCount(roomId);
      socket.to(roomId).emit("room:user_joined", { uid, roomId });
    });

    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
      broadcastMemberCount(roomId);
      socket.to(roomId).emit("room:user_left", { uid, roomId });
    });

    // ── Helper for Member Count ──────────────────────────────────
    async function broadcastMemberCount(roomId) {
      const sockets = await io.in(roomId).fetchSockets();
      const onlineUids = new Set(sockets.map(s => s.uid));
      io.to(roomId).emit("room:member_count", {
        roomId,
        onlineCount: onlineUids.size,
      });
    }


    // ── Typing indicators ────────────────────────────────────────
    socket.on("typing:start", ({ roomId }) => {
      if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Set());
      typingUsers.get(roomId).add(uid);
      socket.to(roomId).emit("typing:update", {
        roomId,
        typingUsers: Array.from(typingUsers.get(roomId)),
      });
    });

    socket.on("typing:stop", ({ roomId }) => {
      typingUsers.get(roomId)?.delete(uid);
      socket.to(roomId).emit("typing:update", {
        roomId,
        typingUsers: Array.from(typingUsers.get(roomId) || []),
      });
    });

    // ── New Message ──────────────────────────────────────────────
    socket.on("message:send", async (data) => {
      try {
        const { roomId, content, type = "text", replyTo = null, fileData = null } = data;
        const db = getDb();

        const messageData = {
          roomId,
          senderId: uid,
          senderName: socket.userName,
          content,
          type,
          replyTo,
          fileData,
          reactions: {},
          readBy: [{ uid, readAt: new Date() }],
          edited: false,
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (type === "text") {
          messageData.content = filter.clean(content);
        }

        const msgRef = await db.collection("messages").add(messageData);
        const message = { id: msgRef.id, ...messageData };

        // Broadcast to room
        io.to(roomId).emit("message:new", message);

        // Update room last message
        await db.collection("rooms").doc(roomId).update({
          lastMessage: {
            content: type === "text" ? messageData.content : `[${type}]`,
            senderId: uid,
            senderName: socket.userName,
            createdAt: new Date(),
          },
          updatedAt: new Date(),
        });

        // Push notifications for mentions
        const mentions = content.match(/@(\w+)/g) || [];
        if (mentions.length > 0) {
          await notifyMentions(mentions, message, roomId);
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Edit Message ─────────────────────────────────────────────
    socket.on("message:edit", async ({ messageId, content, roomId }) => {
      try {
        const db = getDb();
        const msgRef = db.collection("messages").doc(messageId);
        const msg = await msgRef.get();

        if (!msg.exists || msg.data().senderId !== uid) {
          return socket.emit("error", { message: "Unauthorized" });
        }

        await msgRef.update({
          content,
          edited: true,
          editedAt: new Date(),
          updatedAt: new Date(),
        });

        io.to(roomId).emit("message:updated", { messageId, content, edited: true });
      } catch (err) {
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    // ── Delete Message ───────────────────────────────────────────
    socket.on("message:delete", async ({ messageId, roomId }) => {
      try {
        const db = getDb();
        const msgRef = db.collection("messages").doc(messageId);
        const msg = await msgRef.get();

        if (!msg.exists || msg.data().senderId !== uid) {
          return socket.emit("error", { message: "Unauthorized" });
        }

        await msgRef.update({ deleted: true, content: "This message was deleted", updatedAt: new Date() });
        io.to(roomId).emit("message:deleted", { messageId, roomId });
      } catch (err) {
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // ── Reactions ────────────────────────────────────────────────
    socket.on("message:react", async ({ messageId, emoji, roomId }) => {
      try {
        const db = getDb();
        const msgRef = db.collection("messages").doc(messageId);
        const msg = await msgRef.get();
        if (!msg.exists) return;

        const reactions = msg.data().reactions || {};
        if (!reactions[emoji]) reactions[emoji] = [];

        const idx = reactions[emoji].indexOf(uid);
        if (idx > -1) reactions[emoji].splice(idx, 1); // toggle off
        else reactions[emoji].push(uid);                // toggle on

        if (reactions[emoji].length === 0) delete reactions[emoji];

        await msgRef.update({ reactions });
        io.to(roomId).emit("message:reaction_updated", { messageId, reactions });
      } catch (err) {
        socket.emit("error", { message: "Failed to react" });
      }
    });

    // ── Read receipts ────────────────────────────────────────────
    socket.on("message:read", async ({ messageId, roomId }) => {
      try {
        const db = getDb();
        const msgRef = db.collection("messages").doc(messageId);
        await msgRef.update({
          readBy: require("firebase-admin").firestore.FieldValue.arrayUnion({
            uid,
            readAt: new Date(),
          }),
        });
        socket.to(roomId).emit("message:read_receipt", { messageId, uid, readAt: new Date() });
      } catch (err) {}
    });

    // ── DM ───────────────────────────────────────────────────────
    socket.on("dm:send", async (data) => {
      const { targetUid, content, type = "text" } = data;
      const targetSocketId = connectedUsers.get(targetUid);
      if (targetSocketId) {
        io.to(targetSocketId).emit("dm:received", {
          from: uid,
          content,
          type,
          createdAt: new Date(),
        });
      }
    });

    // ── WebRTC Signaling (Video/Audio Calls) ─────────────────────
    // Initiate call
    socket.on("call:initiate", ({ targetUid, callType = "video", roomId }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        const callId = `${[uid, targetUid].sort().join("_")}_${Date.now()}`;
        socket.callId = callId;
        io.to(targetSocket).emit("call:incoming", {
          from: {
            uid: uid,
            name: socket.userName,
          },
          callType,
          roomId,
          callId,
        });
      } else {
        socket.emit("call:rejected", { reason: "User offline" });
      }
    });


    // Accept call
    socket.on("call:accept", ({ targetUid, callId }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        io.to(targetSocket).emit("call:accepted", { from: uid, callId });
      }
    });

    // Send offer

    socket.on("call:offer", ({ targetUid, offer, callId, roomId }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        activeCallSessions.set(callId, {
          initiator: uid,
          recipient: targetUid,
          startTime: Date.now(),
          type: "video",
        });
        io.to(targetSocket).emit("call:offer", { from: uid, offer, callId, roomId });
      }
    });

    // Send answer
    socket.on("call:answer", ({ targetUid, answer, callId }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        io.to(targetSocket).emit("call:answer", { from: uid, answer, callId });
      }
    });

    // ICE candidate
    socket.on("call:ice_candidate", ({ targetUid, candidate, callId }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        io.to(targetSocket).emit("call:ice_candidate", { from: uid, candidate, callId });
      }
    });

    // Screen sharing start
    socket.on("call:screen_start", ({ targetUid, callId }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        io.to(targetSocket).emit("call:screen_start", { from: uid, callId });
      }
    });

    // Screen sharing stop
    socket.on("call:screen_stop", ({ targetUid, callId }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        io.to(targetSocket).emit("call:screen_stop", { from: uid, callId });
      }
    });

    // End call
    socket.on("call:end", ({ targetUid, callId, duration = 0 }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        io.to(targetSocket).emit("call:ended", { from: uid, callId });
      }

      // Record call in history
      if (activeCallSessions.has(callId)) {
        const session = activeCallSessions.get(callId);
        recordCall(session.initiator, session.recipient, session.type, duration, "completed")
          .catch((err) => console.error("Error recording call:", err));
        activeCallSessions.delete(callId);
      }
    });

    // Reject/Decline call
    socket.on("call:reject", ({ targetUid, callId, reason = "busy" }) => {
      const targetSocket = connectedUsers.get(targetUid);
      if (targetSocket) {
        io.to(targetSocket).emit("call:rejected", { from: uid, callId, reason });
      }

      if (activeCallSessions.has(callId)) {
        const session = activeCallSessions.get(callId);
        recordCall(session.initiator, session.recipient, session.type, 0, "missed")
          .catch((err) => console.error("Error recording call:", err));
        activeCallSessions.delete(callId);
      }
    });

    // ── Presence/Status Update ──────────────────────────────────
    socket.on("presence:update", async ({ status }) => {
      if (["online", "away", "busy", "offline"].includes(status)) {
        await updateUserPresence(uid, status);
        io.emit("user:presence", { uid, status, lastSeen: new Date() });
      }
    });

    // ── Disconnect ──────────────────────────────────────────────
    socket.on("disconnect", async () => {
      if (connectedUsers.get(uid) === socket.id) {
        connectedUsers.delete(uid);
        await updateUserPresence(uid, "offline");

        // Notify all rooms user was in
        const rooms = Array.from(socket.rooms);
        rooms.forEach(roomId => {
          if (roomId !== socket.id) broadcastMemberCount(roomId);
        });

        io.emit("user:presence", { uid, status: "offline", lastSeen: new Date() });
        console.log(`❌ User disconnected: ${uid}`);
      }
    });
  });

  return io;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
async function notifyMentions(mentions, message, roomId) {
  const db = getDb();
  for (const mention of mentions) {
    const username = mention.replace("@", "");
    const snapshot = await db.collection("users").where("username", "==", username).limit(1).get();
    if (!snapshot.empty) {
      const user = snapshot.docs[0].data();
      if (user.fcmToken) {
        await sendPushNotification(user.fcmToken, {
          title: `${message.senderName} mentioned you`,
          body: message.content,
          data: { roomId, messageId: message.id },
        });
      }
    }
  }
}

module.exports = { initSocket };

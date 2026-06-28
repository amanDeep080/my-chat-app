const { getMessaging, getDb } = require("./firebase");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Push notification via FCM
const sendPushNotification = async (fcmToken, { title, body, data = {} }) => {
  try {
    const messaging = getMessaging();
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      webpush: {
        notification: {
          title,
          body,
          icon: "/logo192.png",
          badge: "/badge.png",
          click_action: "/",
        },
      },
    });
  } catch (error) {
    console.error("FCM error:", error.message);
  }
};

// Email notification
const sendEmailNotification = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"ChatApp" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email error:", error.message);
  }
};

// In-app notification stored in Firestore
const createInAppNotification = async (uid, notification) => {
  try {
    const db = getDb();
    await db.collection("notifications").add({
      uid,
      ...notification,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};

module.exports = { sendPushNotification, sendEmailNotification, createInAppNotification };

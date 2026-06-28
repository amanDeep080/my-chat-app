// Firebase Cloud Messaging Service Worker
// Place this file at: client/public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

const params = new URL(location).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey") || self.FIREBASE_API_KEY,
  authDomain: params.get("authDomain") || self.FIREBASE_AUTH_DOMAIN,
  projectId: params.get("projectId") || self.FIREBASE_PROJECT_ID,
  storageBucket: params.get("storageBucket") || self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: params.get("messagingSenderId") || self.FIREBASE_MESSAGING_SENDER_ID,
  appId: params.get("appId") || self.FIREBASE_APP_ID,
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || "/logo192.png",
    badge: "/badge.png",
    data: payload.data,
    actions: [{ action: "open", title: "Open Chat" }],
  });
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const roomId = event.notification.data?.roomId;
  const url = roomId ? `/room/${roomId}` : "/";
  event.waitUntil(clients.openWindow(url));
});

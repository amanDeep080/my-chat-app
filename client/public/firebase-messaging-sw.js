// Firebase Cloud Messaging Service Worker
// Place this file at: client/public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

const params = new URL(location).searchParams;

firebase.initializeApp({
  apiKey: "AIzaSyBTA6wep6wlR3-wgeU3g4r8CDzhe9phky0",
  authDomain: "chat-app-d0af3.firebaseapp.com",
  projectId: "chat-app-d0af3",
  storageBucket: "chat-app-d0af3.appspot.com",
  messagingSenderId: "633384084225",
  appId: "1:633384084225:web:ab67cdda0d754d7e6eb100",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received", payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || "New Message";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/logo192.png",
    badge: "/badge.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const roomId = event.notification.data?.roomId;
  const url = roomId ? `/room/${roomId}` : "/";
  event.waitUntil(clients.openWindow(url));
});

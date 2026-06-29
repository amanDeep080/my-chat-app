import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Helper to strip accidental quotes and whitespace from .env variables
const cleanEnv = (val) => val?.trim().replace(/^["']|["']$/g, '');

const firebaseConfig = {
  apiKey: cleanEnv(process.env.REACT_APP_FIREBASE_API_KEY) || "AIzaSyBTA6wep6wlR3-wgeU3g4r8CDzhe9phky0",
  authDomain: cleanEnv(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN) || "chat-app-d0af3.firebaseapp.com",
  projectId: cleanEnv(process.env.REACT_APP_FIREBASE_PROJECT_ID) || "chat-app-d0af3",
  storageBucket: cleanEnv(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET) || "chat-app-d0af3.appspot.com",

  messagingSenderId: cleanEnv(process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID) || "633384084225",
  appId: cleanEnv(process.env.REACT_APP_FIREBASE_APP_ID) || "1:633384084225:web:ab67cdda0d754d7e6eb100",
};

console.log("🔍 Exact API Key seen by Firebase:", `[${firebaseConfig.apiKey}]`);

if (!firebaseConfig.apiKey) {
  console.error("Loaded Firebase Config:", firebaseConfig);
  throw new Error("🚨 Firebase API key is missing! Ensure your client/.env file exists, contains REACT_APP_FIREBASE_API_KEY, and you have restarted your development server.");
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Messaging (push notifications)
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {}
export { messaging };

export const requestNotificationPermission = async () => {
  try {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications.");
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log("Notification permission status:", permission);

    if (permission === "granted" && messaging) {
      // Ensure service worker is ready before getting token
      const registration = await navigator.serviceWorker.ready;
      const vKey = cleanEnv(process.env.REACT_APP_FIREBASE_VAPID_KEY);

      console.log(`FCM: Using VAPID Key (Length: ${vKey?.length || 0})`);

      if (!vKey || vKey.length < 50) {
        console.error("VAPID key is too short or missing. Current length:", vKey?.length || 0);
        return null;
      }

      console.log("Requesting FCM token...");
      const token = await getToken(messaging, {
        vapidKey: vKey,
        serviceWorkerRegistration: registration
      });
      return token;
    }
  } catch (error) {
    console.error("Notification permission error:", error);
  }
  return null;
};

export const onForegroundMessage = (callback) => {
  if (messaging) return onMessage(messaging, callback);
};

export default app;

const admin = require("firebase-admin");

let db, auth, storage, messaging;

const initFirebase = () => {
  if (admin.apps.length === 0) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
    };

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName,
    });

    console.log(`✅ Firebase Admin initialized`);
    console.log(`📂 Project: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`🪣 Bucket:  ${bucketName}`);



  }

  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();
  messaging = admin.messaging();
};

const getDb = () => db;
const getAuth = () => auth;
const getStorage = () => storage;
const getMessaging = () => messaging;

module.exports = { initFirebase, getDb, getAuth, getStorage, getMessaging };

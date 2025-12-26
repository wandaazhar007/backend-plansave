import admin from "firebase-admin";

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return;

  // If user provided base64 JSON, use it. Otherwise rely on GOOGLE_APPLICATION_CREDENTIALS.
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!admin.apps.length) {
    if (b64 && b64.trim().length > 0) {
      const json = Buffer.from(b64, "base64").toString("utf8");
      const serviceAccount = JSON.parse(json);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Uses GOOGLE_APPLICATION_CREDENTIALS automatically
      admin.initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
  }

  initialized = true;
}

export { admin };
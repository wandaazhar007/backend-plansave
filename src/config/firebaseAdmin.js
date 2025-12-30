import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized || admin.apps.length > 0) return admin;

  const serviceAccountPath = path.resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH);

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(
      `[FirebaseAdmin] service account file not found at: ${serviceAccountPath}`
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(serviceAccountPath, "utf-8");
  const serviceAccount = JSON.parse(raw);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: env.FIREBASE_PROJECT_ID,
  });

  initialized = true;
  return admin;
}
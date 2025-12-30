import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const uid = process.argv[2];
const flagRaw = process.argv[3];

if (!uid) {
  console.error("Usage: node scripts/setAdminClaim.js <uid> <true|false>");
  process.exit(1);
}

const isAdmin = String(flagRaw).toLowerCase() === "true";

const projectId = process.env.FIREBASE_PROJECT_ID;
const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!projectId || !saPath) {
  console.error("Missing FIREBASE_PROJECT_ID / FIREBASE_SERVICE_ACCOUNT_PATH in .env");
  process.exit(1);
}

const serviceAccountPath = path.resolve(saPath);
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`service account file not found: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId,
});

async function main() {
  // set custom claims
  await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });

  // mirror role ke Firestore
  const db = admin.firestore();
  const ref = db.collection("users").doc(uid);

  const now = new Date().toISOString();
  await ref.set(
    { role: isAdmin ? "admin" : "user", updatedAt: now },
    { merge: true }
  );

  console.log(`OK: uid=${uid} admin=${isAdmin}`);
}

main().catch((e) => {
  console.error("FAILED:", e?.message || e);
  process.exit(1);
});
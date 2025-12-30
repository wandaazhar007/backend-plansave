import { initFirebaseAdmin } from "../config/firebaseAdmin.js";

export function getDb() {
  const admin = initFirebaseAdmin();
  return admin.firestore();
}
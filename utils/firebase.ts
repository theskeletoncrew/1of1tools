import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const apps = getApps();

export const firebaseAdmin =
  apps.length > 0 && apps[0]
    ? apps[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          privateKey: process.env.GOOGLE_PRIVATE_KEY,
          clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        }),
      });

export const authAdmin = getAuth(firebaseAdmin);

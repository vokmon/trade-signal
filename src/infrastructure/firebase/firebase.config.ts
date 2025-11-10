import { initializeApp } from "firebase-admin/app";

import { cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

const app = initializeApp({
  credential: cert({
    projectId: firebaseConfig.projectId,
    clientEmail: firebaseConfig.clientEmail,
    privateKey: firebaseConfig.privateKey,
  }),
  databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
});

export const firestoreDatabase = getFirestore(app);

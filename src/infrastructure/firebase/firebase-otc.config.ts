import { initializeApp } from "firebase-admin/app";

import { cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const firebaseOtcConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID_OTC,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL_OTC,
  privateKey: process.env.FIREBASE_PRIVATE_KEY_OTC,
};

const app = initializeApp(
  {
    credential: cert({
      projectId: firebaseOtcConfig.projectId,
      clientEmail: firebaseOtcConfig.clientEmail,
      privateKey: firebaseOtcConfig.privateKey,
    }),
    databaseURL: `https://${firebaseOtcConfig.projectId}.firebaseio.com`,
  },
  "otcApp"
);

export const firestoreOtcDatabase = getFirestore(app);

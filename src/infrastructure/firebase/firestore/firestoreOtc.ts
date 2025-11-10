import {
  firebaseOtcConfig,
  firestoreOtcDatabase,
} from "../firebase-otc.config.ts";
import { BaseFirestoreRepo } from "./base-firestore-repo.ts";

export class FirestoreRepo extends BaseFirestoreRepo {
  constructor() {
    const db = firebaseOtcConfig.projectId ? firestoreOtcDatabase : null;
    super(db);
  }
}

import { firebaseConfig, firestoreDatabase } from "../firebase.config.ts";
import { BaseFirestoreRepo } from "./base-firestore-repo.ts";

export class FirestoreRepo extends BaseFirestoreRepo {
  constructor() {
    const db = firebaseConfig.projectId ? firestoreDatabase : null;
    super(db);
  }
}

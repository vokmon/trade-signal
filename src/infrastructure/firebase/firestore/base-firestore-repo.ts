import { Firestore } from "firebase-admin/firestore";
import type { TradeSignal } from "../../../types/signal/TradeSignal.ts";

export abstract class BaseFirestoreRepo {
  protected readonly db: Firestore | null;

  constructor(db: Firestore | null) {
    this.db = db;
  }

  public async saveSignalToFireStore(
    signal: TradeSignal,
    collectionName: string
  ): Promise<void> {
    if (!this.db) {
      console.error("Firestore database is not initialized");
      return;
    }

    try {
      const date = new Date();
      const data = {
        signal,
        created: date,
      };
      await this.db
        .collection(collectionName)
        .doc("" + date.getTime())
        .set(data);
      console.log(`Successfully insert signal:`, data);
    } catch (e) {
      console.error(`Failed insert signal: ${signal}`, e);
    }
  }

  public async purgeSignals(
    thresholdDate: Date,
    collectionName: string
  ): Promise<void> {
    if (!this.db) {
      console.error("Firestore database is not initialized");
      return;
    }

    try {
      console.log(
        `Purge firestore message for ${collectionName} starts at ${new Date()}. Remove data older than ${thresholdDate}`
      );

      const snapshot = await this.db
        .collection(collectionName)
        .where("created", "<=", thresholdDate)
        .get();

      if (snapshot.empty) {
        console.log(
          `No documents found to purge for collection '${collectionName}'`
        );
        return;
      }

      // Get a new write batch
      const batch = this.db.batch();

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(
        `Purge firestore messages for the collection '${collectionName}' finished at ${new Date()}. Removed ${
          snapshot.size
        } document(s) older than ${thresholdDate}`
      );
    } catch (e) {
      console.error(
        `Failed to purge messages for the collection '${collectionName}'`,
        e
      );
    }
  }
}


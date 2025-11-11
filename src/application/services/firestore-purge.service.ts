import type { AppConfig } from "../../config/app.config";
import { FirestoreRepo } from "../../infrastructure/firebase/firestore/firestore";
import { FirestoreOtcRepo } from "../../infrastructure/firebase/firestore/firestoreOtc";
import {
  AllMainCollections,
  AllOtcCollections,
} from "../../infrastructure/firebase/firestore/fire-store-collections";

/**
 * Service that handles periodic purging of old Firestore data
 * Purges data older than the configured retention period from all collections
 */
export class FirestorePurgeService {
  private purgeInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private readonly firestoreRepo: FirestoreRepo;
  private readonly firestoreOtcRepo: FirestoreOtcRepo;

  constructor(private readonly config: AppConfig) {
    this.firestoreRepo = new FirestoreRepo();
    this.firestoreOtcRepo = new FirestoreOtcRepo();
  }

  /**
   * Initialize and start the periodic purge process
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log(
        `⚠️ Firestore purge service already initialized, skipping...`
      );
      return;
    }

    try {
      // Run initial purge
      await this.purgeAllCollections();

      // Set up periodic purge
      const purgeIntervalMs = this.config.firestore.purgeIntervalMs;
      this.purgeInterval = setInterval(async () => {
        try {
          console.log(
            `🔄-🧹🧹🧹 Periodic Firestore purge triggered (every ${
              purgeIntervalMs / 1000 / 60 / 60
            } hours)`
          );
          await this.purgeAllCollections();
        } catch (error) {
          console.error(`❌ Failed during periodic Firestore purge:`, error);
          // Continue running - next purge will be attempted
        }
      }, purgeIntervalMs);

      this.isInitialized = true;
      console.log(
        `✅ Firestore purge service initialized with purge interval: ${
          purgeIntervalMs / 1000 / 60 / 60
        } hours, retention: ${this.config.firestore.purgeRetentionHours} hours`
      );
    } catch (error) {
      console.error(`❌ Failed to initialize Firestore purge service:`, error);
      throw error;
    }
  }

  /**
   * Purge all collections (main and OTC) with data older than retention period
   */
  private async purgeAllCollections(): Promise<void> {
    try {
      const retentionHours = this.config.firestore.purgeRetentionHours;
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - retentionHours);

      console.log(
        `🧹🧹🧹🧹🧹🧹 Starting Firestore purge for all collections. Removing data older than ${thresholdDate.toISOString()} (${retentionHours} hours)`
      );

      // Purge main collections
      const mainPurgePromises = AllMainCollections.map((collectionName) =>
        this.firestoreRepo
          .purgeSignals(thresholdDate, collectionName)
          .catch((error) => {
            console.error(
              `❌ Failed to purge main collection '${collectionName}':`,
              error
            );
          })
      );

      // Purge OTC collections
      const otcPurgePromises = AllOtcCollections.map((collectionName) =>
        this.firestoreOtcRepo
          .purgeSignals(thresholdDate, collectionName)
          .catch((error) => {
            console.error(
              `❌ Failed to purge OTC collection '${collectionName}':`,
              error
            );
          })
      );

      // Wait for all purges to complete
      await Promise.allSettled([...mainPurgePromises, ...otcPurgePromises]);

      console.log(
        `✅ Firestore purge completed for all collections at ${new Date().toISOString()}`
      );
    } catch (error) {
      console.error(`❌ Failed during Firestore purge:`, error);
      throw error;
    }
  }

  /**
   * Stop the purge service and clear the interval
   */
  stop(): void {
    try {
      if (this.purgeInterval) {
        clearInterval(this.purgeInterval);
        this.purgeInterval = null;
        console.log(`🛑 Stopped Firestore purge service`);
      }

      this.isInitialized = false;
    } catch (error) {
      console.error(`❌ Failed to stop Firestore purge service:`, error);
      this.isInitialized = false;
      this.purgeInterval = null;
    }
  }
}

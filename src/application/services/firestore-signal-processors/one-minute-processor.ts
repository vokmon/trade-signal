import type { ISignalProcessor } from "./signal-processor.interface";
import type { TradeSignal } from "../../../types/signal/TradeSignal";
import { FirestoreRepo } from "../../../infrastructure/firebase/firestore/firestore";
import { Signal1M } from "../../../infrastructure/firebase/firestore/fire-store-collections";

/**
 * Processor for handling 1-minute signals (regular, non-OTC)
 */
export class OneMinuteProcessor implements ISignalProcessor {
  private readonly firestoreRepo: FirestoreRepo;

  constructor() {
    this.firestoreRepo = new FirestoreRepo();
  }

  async saveSignal(signal: TradeSignal): Promise<void> {
    await this.firestoreRepo.saveSignalToFireStore(signal, Signal1M);
  }
}

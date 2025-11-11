import type { ISignalProcessor } from "./signal-processor.interface";
import type { TradeSignal } from "../../../types/signal/TradeSignal";
import { FirestoreOtcRepo } from "../../../infrastructure/firebase/firestore/firestoreOtc";
import { Signal1MOtc } from "../../../infrastructure/firebase/firestore/fire-store-collections";

/**
 * Processor for handling 1-minute OTC signals
 */
export class OneMinuteOtcProcessor implements ISignalProcessor {
  private readonly firestoreOtcRepo: FirestoreOtcRepo;

  constructor() {
    this.firestoreOtcRepo = new FirestoreOtcRepo();
  }

  async saveSignal(signal: TradeSignal): Promise<void> {
    await this.firestoreOtcRepo.saveSignalToFireStore(signal, Signal1MOtc);
  }
}

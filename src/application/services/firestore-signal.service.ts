import type { TradeSignal } from "../../types/signal/TradeSignal";
import type { ISignalProcessor } from "./firestore-signal-processors/signal-processor.interface";
import { OneMinuteProcessor } from "./firestore-signal-processors/one-minute-processor";
import { OneMinuteOtcProcessor } from "./firestore-signal-processors/one-minute-otc-processor";
import { FiveMinutesProcessor } from "./firestore-signal-processors/five-minutes-processor";
import { FiveMinutesOtcProcessor } from "./firestore-signal-processors/five-minutes-otc-processor";

/**
 * Service that handles saving signals to Firestore
 * Routes signals to the appropriate processor based on timeframe and OTC status
 */
export class FirestoreSignalService {
  private readonly processors: Map<string, ISignalProcessor>;

  constructor() {
    this.processors = new Map<string, ISignalProcessor>([
      ["oneMinute:false", new OneMinuteProcessor()],
      ["oneMinute:true", new OneMinuteOtcProcessor()],
      ["fiveMinutes:false", new FiveMinutesProcessor()],
      ["fiveMinutes:true", new FiveMinutesOtcProcessor()],
    ]);
  }

  /**
   * Saves a signal to Firestore, routing to the appropriate processor
   * based on timeframe (1 minute or 5 minutes) and OTC status
   * @param signal The formatted signal to save
   */
  async saveSignal(signal: TradeSignal): Promise<void> {
    try {
      const key = `${signal.data.timeframe}:${signal.data.isOtc}`;
      const processor = this.processors.get(key);

      if (!processor) {
        console.error(
          `🗄️ No processor found for timeframe: ${signal.data.timeframe}, isOtc: ${signal.data.isOtc}`
        );
        return;
      }

      await processor.saveSignal(signal);
    } catch (error) {
      console.error("🗄️ Error saving signal to Firestore:", error);
    }
  }
}

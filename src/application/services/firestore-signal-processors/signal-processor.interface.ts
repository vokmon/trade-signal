import type { TradeSignal } from "../../../types/signal/TradeSignal";

/**
 * Interface for signal processors that handle saving signals to specific Firestore collections
 */
export interface ISignalProcessor {
  /**
   * Saves a signal to the appropriate Firestore collection
   * @param signal The signal to save
   */
  saveSignal(signal: TradeSignal): Promise<void>;
}

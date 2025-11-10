import type { SignalType } from "./Signal";
import type { SignalResult } from "../../application/processors/indicators/signalCalculator";

/**
 * Structured signal data ready for logging and persistence (e.g., Firestore)
 */
export interface TradeSignal {
  message: string;
  created: number;
  data: {
    activeId: number;
    activeName: string;
    activeDisplayName: string;
    activeImageUrl: string;
    action: "BUY" | "SELL";
    zone: "Support zone" | "Resistance zone";
    timeframe: SignalTimeframe;
    isOtc: boolean;
  };
}

export type SignalTimeframe = keyof FireStoreSignalCollection;
export type FireStoreSignalCollection = {
  oneMinute: string;
  fiveMinutes: string;
};

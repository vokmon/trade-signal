import type {
  Active,
  DigitalOptionsUnderlying,
} from "@quadcode-tech/client-sdk-js";
import type { SignalResult } from "../../application/processors/indicators/signalCalculator";
import type { SignalType } from "../../types/signal/Signal";

export interface SignalChangeEvent {
  signal: SignalResult;
  active: DigitalOptionsUnderlying;
  candleSize: number;
  previousSignal: SignalType | null;
  activeData: Active | null;
}

export interface ISignalHandlerService {
  /**
   * Handles a signal change event
   * This method is responsible for formatting, logging, and persisting the signal
   * @param event The signal change event
   */
  handleSignalChange(event: SignalChangeEvent): Promise<void>;
}

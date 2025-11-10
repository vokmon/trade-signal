import type { DigitalOptionsUnderlying } from "@quadcode-tech/client-sdk-js";

export interface IActiveProcessingService {
  initialize(timeframe: 1 | 5): Promise<void>;
  processActive(
    active: DigitalOptionsUnderlying,
    candleSize: number
  ): Promise<void>;
  stopAllProcessing(): void;
}

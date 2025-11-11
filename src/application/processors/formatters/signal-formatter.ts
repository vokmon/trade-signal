import type { TradeSignal } from "../../../types/signal/TradeSignal";
import { SignalType } from "../../../types/signal/Signal";
import type { SignalChangeEvent } from "../../../domain/interfaces/signal-handler.service.interface";

/**
 * Utility class for formatting signal data
 * Pure data transformation - stateless utility
 */
export class SignalFormatter {
  /**
   * Formats a signal result into a structured object ready for logging and persistence
   * @param signal The signal result from calculation
   * @param active The active (underlying) information
   * @param candleSize The candle size in seconds
   * @param previousSignal The previous signal type (if any)
   * @returns A formatted signal object
   */
  formatSignal({
    signal,
    active,
    candleSize,
    activeData,
  }: SignalChangeEvent): TradeSignal {
    const message = `${active.name.replace(/-op$/i, "")} | ${
      signal.signal === SignalType.PUT ? "🔻" : "🔺"
    } ${
      signal.signal === SignalType.PUT
        ? " [Resistance zone]"
        : " [Support zone]"
    }`;

    return {
      message,
      created: new Date(),
      data: {
        activeId: active.activeId,
        activeName: active.name,
        activeDisplayName: activeData?.name ?? active.name,
        activeImageUrl: activeData?.imageUrl ?? "",
        action: signal.signal === SignalType.CALL ? "BUY" : "SELL",
        zone:
          signal.signal === SignalType.PUT ? "Resistance zone" : "Support zone",
        timeframe: candleSize === 60 ? "oneMinute" : "fiveMinutes",
        isOtc: activeData?.isOtc ?? false,
      },
    };
  }

  /**
   * Formats a signal result into a human-readable string for console logging
   * @param formattedSignal The formatted signal object
   * @returns A formatted string for console output
   */
  formatSignalForLogging(signal: TradeSignal): string {
    const { message, data } = signal;

    return `🔔-📊 Signal detected: ${message} - ${data.timeframe}`;
  }
}

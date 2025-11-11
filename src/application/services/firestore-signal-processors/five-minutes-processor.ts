import type { ISignalProcessor } from "./signal-processor.interface";
import type { TradeSignal } from "../../../types/signal/TradeSignal";
import { FirestoreRepo } from "../../../infrastructure/firebase/firestore/firestore";
import {
  Signal5M,
  Signal5MVip,
  SignalStatistic,
} from "../../../infrastructure/firebase/firestore/fire-store-collections";

/**
 * Processor for handling 5-minute signals (regular, non-OTC)
 */
export class FiveMinutesProcessor implements ISignalProcessor {
  private readonly firestoreRepo: FirestoreRepo;

  constructor() {
    this.firestoreRepo = new FirestoreRepo();
  }

  async saveSignal(signal: TradeSignal): Promise<void> {
    // SignalStatistic
    // await this.firestoreRepo.saveSignalToFireStore(signal, Signal5MVip);
    await Promise.allSettled([
      this.saveSignalTo5MVip(signal),
      this.saveSignalTo5M(signal),
      this.saveSignalToStatistic(signal),
    ]);
  }

  private async saveSignalTo5MVip(signal: TradeSignal): Promise<void> {
    await this.firestoreRepo.saveSignalToFireStore(signal, Signal5MVip);
  }

  private async saveSignalTo5M(signal: TradeSignal): Promise<void> {
    // Remove text after '[' in the message
    const originalMessage = signal.message;
    const bracketIndex = originalMessage.indexOf("[");
    const truncatedMessage =
      bracketIndex !== -1
        ? originalMessage.substring(0, bracketIndex)
        : originalMessage;

    const signalFor5M = {
      ...signal,
      message: truncatedMessage.trim(),
    };

    await this.firestoreRepo.saveSignalToFireStore(signalFor5M, Signal5M);
  }

  private async saveSignalToStatistic(signal: TradeSignal): Promise<void> {
    const orderRate = 0.5;
    const winRate = 0.7;

    try {
      const currencyPair = this.extractCurrencyPair(signal);

      const orderRateResult = this.randnBm();
      const shouldContinue = orderRateResult <= orderRate;

      if (!shouldContinue) {
        return;
      }

      const result = this.randnBm();
      const isWin = result <= winRate;
      const resultWord = isWin ? "WIN" : "LOSS";
      const resultEmoji = isWin ? "🟢" : "🔴";
      const statisticMessage = `${currencyPair} ${resultEmoji} ${resultWord}`;

      // Create a statistic signal object
      const statisticSignal: TradeSignal = {
        ...signal,
        message: statisticMessage,
      };

      await this.firestoreRepo.saveSignalToFireStore(
        statisticSignal,
        SignalStatistic
      );

      console.log(
        `🗄️-🟢 Successfully saved statistic data - ${statisticSignal.message}`
      );
    } catch (e) {
      console.error(
        `Unable to calculate statistic data for ${signal.message}`,
        e
      );
    }
  }

  /**
   * Generates a random number between 0 and 1 (Box-Muller transformation)
   */
  private randnBm(): number {
    return Math.random();
  }

  /**
   * Extracts currency pair from signal message or active name
   */
  private extractCurrencyPair(signal: TradeSignal): string {
    // Try to extract from message first (e.g., "ETHUSD | 🔻  [Resistance zone]")
    const messageMatch = signal.message.match(/^([A-Z]+)\s*\|/);
    if (messageMatch && messageMatch[1]) {
      return messageMatch[1];
    }

    // Fallback to activeDisplayName or activeName (remove -op suffix if present)
    const activeName = signal.data.activeDisplayName || signal.data.activeName;
    return activeName.replace(/-op$/i, "").toUpperCase();
  }
}

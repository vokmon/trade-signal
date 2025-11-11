import type {
  ISignalHandlerService,
  SignalChangeEvent,
} from "../../domain/interfaces/signal-handler.service.interface";
import { SignalFormatter } from "../processors/formatters/signal-formatter";
import type { ISdkService } from "../../domain/interfaces/sdk.service.interface";
import { FirestoreSignalService } from "./firestore-signal.service";

/**
 * Service that handles signal change events
 * Orchestrates formatting, logging, and persistence
 */
export class SignalHandlerService implements ISignalHandlerService {
  private readonly signalFormatter: SignalFormatter;
  private readonly firestoreSignalService: FirestoreSignalService;

  constructor(private readonly sdkService: ISdkService) {
    this.signalFormatter = new SignalFormatter();
    this.firestoreSignalService = new FirestoreSignalService();
  }

  async handleSignalChange(changeEvent: SignalChangeEvent): Promise<void> {
    try {
      // Format the signal into a structured object
      const formattedSignal = this.signalFormatter.formatSignal(changeEvent);

      // Log the formatted signal
      // const formattedOutput =
      //   this.signalFormatter.formatSignalForLogging(formattedSignal);
      // console.log(formattedOutput);

      // Save formattedSignal to Firestore
      await this.firestoreSignalService.saveSignal(formattedSignal);
      console.log(
        `🔔-🗄️ Saved ${formattedSignal.message} - ${formattedSignal.data.timeframe}`
      );
    } catch (error) {
      console.error(`❌-🗄️ Failed to handle signal change:`, error);
    }
  }
}

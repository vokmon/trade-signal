import type {
  ISignalHandlerService,
  SignalChangeEvent,
} from "../../domain/interfaces/signal-handler.service.interface";
import { SignalFormatter } from "../processors/formatters/signal-formatter";
import type { ISdkService } from "../../domain/interfaces/sdk.service.interface";

/**
 * Service that handles signal change events
 * Orchestrates formatting, logging, and persistence
 */
export class SignalHandlerService implements ISignalHandlerService {
  private readonly signalFormatter: SignalFormatter;

  constructor(private readonly sdkService: ISdkService) {
    this.signalFormatter = new SignalFormatter();
  }

  async handleSignalChange(changeEvent: SignalChangeEvent): Promise<void> {
    // Format the signal into a structured object
    const formattedSignal = this.signalFormatter.formatSignal(changeEvent);

    // Log the formatted signal
    const formattedOutput =
      this.signalFormatter.formatSignalForLogging(formattedSignal);
    console.log(formattedOutput);

    // TODO: Save formattedSignal to Firestore here
    // await this.firestoreService.saveSignal(formattedSignal);
  }
}

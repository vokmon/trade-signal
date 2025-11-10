import type {
  Active,
  DigitalOptionsUnderlying,
} from "@quadcode-tech/client-sdk-js";
import type { IActiveProcessingService } from "../../domain/interfaces/active-processing.service.interface";
import type { IChartMonitoringService } from "../../domain/interfaces/chart-monitoring.service.interface";
import type { ISdkService } from "../../domain/interfaces/sdk.service.interface";
import type { ISignalHandlerService } from "../../domain/interfaces/signal-handler.service.interface";
import type { AppConfig } from "../../config/app.config";
import { ActiveProcessor } from "../processors/active-processor";
import type { SignalResult } from "../processors/indicators/signalCalculator";
import type { SignalType } from "../../types/signal/Signal";

export class ActiveProcessingService implements IActiveProcessingService {
  // Use composite key: `${activeId}-${candleSize}` to track processors
  private processors: Map<string, ActiveProcessor> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private readonly timeframe = [1, 5];
  constructor(
    private readonly sdkService: ISdkService,
    private readonly chartMonitoringService: IChartMonitoringService,
    private readonly config: AppConfig,
    private readonly signalHandler: ISignalHandlerService
  ) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log(`⚠️ Service already initialized, skipping...`);
      return;
    }

    // Initial processing
    await this.refreshAndProcessActives();

    // Set up periodic refresh
    const refreshIntervalMs = this.config.trading.activeRefreshIntervalMs;
    this.refreshInterval = setInterval(async () => {
      console.log(
        `🔄 Periodic refresh triggered (every ${
          refreshIntervalMs / 1000 / 60
        } minutes)`
      );
      await this.refreshAndProcessActives();
    }, refreshIntervalMs);

    this.isInitialized = true;
    console.log(
      `✅ Active processing service initialized with refresh interval: ${
        refreshIntervalMs / 1000 / 60
      } minutes`
    );
  }

  private async refreshAndProcessActives(): Promise<void> {
    const sdk = await this.sdkService.waitForConnection();

    // Stop all current processors before refreshing
    console.log(`🛑 Stopping all current processors before refresh...`);
    this.stopAllProcessing();

    // Get current time
    const now = sdk.currentTime();
    console.log(`⏰ Current time:`, now);

    // Get digital options
    const digitalOptions = await sdk.digitalOptions();
    console.log(`📈 Digital options retrieved`);

    // Get available actives for trading
    const actives = digitalOptions.getUnderlyingsAvailableForTradingAt(now);
    console.log(`✅ Found ${actives.length} actives available for trading`);

    const activesToProcess = actives;
    for (const timeframe of this.timeframe) {
      const candleSize = timeframe * 60;
      console.log(
        `📊 Initializing active processing with timeframe: ${timeframe} minute(s) (${candleSize}s)...`
      );

      const processingPromises = activesToProcess.map((active) =>
        this.processActive(active, candleSize).catch((error) => {
          console.error(
            `❌ Failed to process active ${active.activeId} (${active.name}):`,
            error
          );
        })
      );
      await Promise.allSettled(processingPromises);
      console.log(
        `🗂️ Started processing ${activesToProcess.length} for timeframe ${timeframe} minutes in parallel`
      );
    }
  }

  async processActive(
    active: DigitalOptionsUnderlying,
    candleSize: number
  ): Promise<void> {
    const activeId = active.activeId;

    if (!activeId) {
      console.warn(`⚠️ Active ID is missing for active:`, active);
      return;
    }

    // Create composite key for tracking processors
    const processorKey = `${activeId}-${candleSize}`;

    // Skip if already processing this active with this candle size
    if (this.processors.has(processorKey)) {
      console.log(
        `⏭️ Active ${activeId} with candle size ${candleSize}s is already being processed, skipping...`
      );
      return;
    }

    const sdk = this.sdkService.getSdk();

    // Create signal change callback that delegates to signal handler
    const onSignalChange = async ({
      signal,
      previousSignal,
      activeData,
    }: {
      signal: SignalResult;
      previousSignal: SignalType | null;
      activeData: Active | null;
    }): Promise<void> => {
      await this.signalHandler.handleSignalChange({
        signal,
        active,
        candleSize,
        previousSignal,
        activeData,
      });
    };

    // Create new processor for this active-candleSize combination
    const activeProcessor = new ActiveProcessor(
      sdk!,
      active,
      candleSize,
      this.chartMonitoringService,
      this.config,
      onSignalChange
    );

    // Store processor
    this.processors.set(processorKey, activeProcessor);

    // Start processing
    await activeProcessor.process();
  }

  stopAllProcessing(): void {
    console.log(`🛑 Stopping all active processing...`);
    for (const processor of this.processors.values()) {
      processor.stop();
    }
    this.processors.clear();
    console.log(`✅ All active processing stopped`);
  }

  stop(): void {
    // Stop periodic refresh
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log(`🛑 Stopped periodic refresh timer`);
    }

    // Stop all processors
    this.stopAllProcessing();

    this.isInitialized = false;
    console.log(`✅ Active processing service stopped`);
  }
}

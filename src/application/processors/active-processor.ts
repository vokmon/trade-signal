import {
  type DigitalOptionsUnderlying,
  type RealTimeChartDataLayer,
  type ClientSdk,
  Active,
} from "@quadcode-tech/client-sdk-js";
import type { IChartMonitoringService } from "../../domain/interfaces/chart-monitoring.service.interface";
import type { AppConfig } from "../../config/app.config";
import { calculateSignalWithDefaults } from "./indicators/signalCalculator";
import { SignalType } from "../../types/signal/Signal";
import type { SignalResult } from "./indicators/signalCalculator";

export class ActiveProcessor {
  private interval: NodeJS.Timeout | null = null;
  private chartLayer: RealTimeChartDataLayer | null = null;
  private lastProcessedTime: number | null = null;
  private isProcessing = false;
  private lastSignal: SignalType | null = null;
  private activeData: Active | null = null;

  constructor(
    private readonly sdk: ClientSdk,
    private readonly active: DigitalOptionsUnderlying,
    private readonly candleSize: number,
    private readonly chartMonitoringService: IChartMonitoringService,
    private readonly config: AppConfig,
    private readonly onSignalChange: ({
      signal,
      previousSignal,
      activeData,
    }: {
      signal: SignalResult;
      previousSignal: SignalType | null;
      activeData: Active | null;
    }) => Promise<void>
  ) {}

  async process(): Promise<void> {
    if (this.isProcessing) {
      console.log(
        `⏭️ Active ${this.active.activeId} (${this.candleSize}s) is already being processed, skipping...`
      );
      return;
    }

    const activeId = this.active.activeId;
    if (!activeId) {
      console.warn(`⚠️ Active ID is missing for active:`, this.active);
      return;
    }

    this.isProcessing = true;

    console.log(
      `🔄 Processing active: ${activeId} (${this.active.name}) with candle size: ${this.candleSize}s`
    );

    try {
      // Fetch active data if not available
      if (!this.activeData) {
        try {
          const actives = await this.sdk.actives();
          this.activeData = await actives.getActive(activeId);
        } catch (error) {
          console.error(
            `❌ Failed to fetch active data for ${activeId}:`,
            error
          );
          // Continue processing even if active data fetch fails
        }
      }

      // Get chart layer
      this.chartLayer = await this.chartMonitoringService.getChartLayer(
        activeId,
        this.candleSize
      );

      if (this.chartLayer) {
        try {
          this.chartLayer.subscribeOnLastCandleChanged(async () => {
            // subscribe to last candle changed
          });
        } catch (error) {
          console.error(
            `❌ Failed to subscribe to last candle changed for active ${activeId}:`,
            error
          );
          // Continue with interval setup even if subscription fails
        }
      }

      // Set up interval for periodic analysis
      this.interval = setInterval(async () => {
        try {
          await this.analyzeCandles();
        } catch (error) {
          console.error(
            `❌ Error during candle analysis for active ${activeId}:`,
            error
          );
          // Continue running - next interval will attempt again
        }
      }, this.config.trading.candleAnalysisIntervalMs);

      console.log(
        `▶️ Started monitoring active ${activeId} (${this.candleSize}s) with ${this.config.trading.candleAnalysisIntervalMs}ms interval`
      );
    } catch (error) {
      console.error(
        `❌ Failed to process active ${activeId} (${this.candleSize}s):`,
        error
      );
      this.isProcessing = false;
      throw error;
    }
  }

  private async handleSignal(signal: SignalResult): Promise<void> {
    try {
      const currentSignal = signal.signal;

      // If signal is the same as previous, just log
      if (this.lastSignal === currentSignal) {
        // console.log(
        //   `🔔 Signal for ${this.active.name} (${this.candleSize}s): ${currentSignal} (unchanged)`
        // );
        return;
      }

      // Signal has changed - notify the caller
      const previousSignal = this.lastSignal;
      try {
        await this.onSignalChange({
          signal,
          previousSignal,
          activeData: this.activeData,
        });
      } catch (error) {
        console.error(
          `❌ Failed to handle signal change for active ${this.active.activeId}:`,
          error
        );
        // Continue processing even if signal handler fails
      }
    } catch (error) {
      console.error(
        `❌ Error in handleSignal for active ${this.active.activeId}:`,
        error
      );
      // Continue processing even if signal handling fails
    }
  }

  private async analyzeCandles(): Promise<void> {
    try {
      if (!this.chartLayer) {
        return;
      }

      const time = new Date();
      const currentSeconds = time.getSeconds();

      // Skip if already processed this second
      if (this.lastProcessedTime === currentSeconds) {
        return;
      }

      // Update last processed time
      this.lastProcessedTime = currentSeconds;

      const now = this.sdk.currentTime();
      const fromTimestamp =
        Math.floor(now.getTime() / 1000) -
        this.candleSize * this.config.trading.candleNumber;

      // Get all candles from chart layer
      const allCandles = await this.chartLayer.fetchAllCandles(fromTimestamp);
      if (allCandles && allCandles.length > 0) {
        const candlesToAnalyze = allCandles.slice(
          -this.config.trading.candleNumber
        );
        const signal = calculateSignalWithDefaults(candlesToAnalyze);
        if (signal.signal !== SignalType.HOLD) {
          await this.handleSignal(signal);
        }

        // Update last signal
        this.lastSignal = signal.signal;
      }
    } catch (error) {
      console.error(
        `❌ Error in analyzeCandles for active ${this.active.activeId}:`,
        error
      );
      // Continue processing - next interval will attempt again
    }
  }

  stop(): void {
    try {
      // Clear interval
      if (this.interval) {
        try {
          clearInterval(this.interval);
          this.interval = null;
        } catch (error) {
          console.error(
            `❌ Failed to clear interval for active ${this.active.activeId}:`,
            error
          );
          this.interval = null;
        }
      }

      // Unsubscribe from chart layer
      if (this.chartLayer) {
        try {
          this.chartLayer.unsubscribeOnLastCandleChanged(() => {});
        } catch (error) {
          console.error(
            `❌ Failed to unsubscribe from chart layer for active ${this.active.activeId}:`,
            error
          );
          // Continue with cleanup
        }
        this.chartLayer = null;
      }

      // Reset state
      this.lastProcessedTime = null;
      this.isProcessing = false;
      this.lastSignal = null;

      console.log(
        `🛑 Stopped processing active ${this.active.activeId} (${this.candleSize}s)`
      );
    } catch (error) {
      console.error(
        `❌ Failed during stop for active ${this.active.activeId}:`,
        error
      );
      // Ensure state is reset even if there was an error
      this.interval = null;
      this.chartLayer = null;
      this.lastProcessedTime = null;
      this.isProcessing = false;
      this.lastSignal = null;
    }
  }

  getActiveId(): number | undefined {
    return this.active.activeId;
  }

  getCandleSize(): number {
    return this.candleSize;
  }
}

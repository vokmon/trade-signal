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

    if (!this.activeData) {
      const actives = await this.sdk.actives();
      this.activeData = await actives.getActive(this.active.activeId);
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
      // Get chart layer
      this.chartLayer = await this.chartMonitoringService.getChartLayer(
        activeId,
        this.candleSize
      );

      if (this.chartLayer) {
        this.chartLayer.subscribeOnLastCandleChanged(async () => {
          // subscribe to last candle changed
        });
      }

      // Set up interval for periodic analysis
      this.interval = setInterval(async () => {
        await this.analyzeCandles();
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
    const currentSignal = signal.signal;

    // If signal is the same as previous, just log
    if (this.lastSignal === currentSignal) {
      console.log(
        `🔔 Signal for ${this.active.name} (${this.candleSize}s): ${currentSignal} (unchanged)`
      );
      return;
    }

    // Signal has changed - notify the caller
    const previousSignal = this.lastSignal;
    await this.onSignalChange({
      signal,
      previousSignal,
      activeData: this.activeData,
    });
  }

  private async analyzeCandles(): Promise<void> {
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
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.chartLayer) {
      this.chartLayer.unsubscribeOnLastCandleChanged(() => {});
      this.chartLayer = null;
    }
    this.lastProcessedTime = null;
    this.isProcessing = false;
    this.chartLayer = null;
    this.lastSignal = null;

    console.log(
      `🛑 Stopped processing active ${this.active.activeId} (${this.candleSize}s)`
    );
  }

  getActiveId(): number | undefined {
    return this.active.activeId;
  }

  getCandleSize(): number {
    return this.candleSize;
  }
}

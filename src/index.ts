import { createAppConfig } from "./config/app.config";
import type { AppConfig } from "./config/app.config";
import { IqOptionClient } from "./infrastructure/clients/iq-option-client";
import { SdkService } from "./application/services/sdk.service";
import { setSdkService } from "./application/services/sdk.service.singleton";
import { ChartMonitoringService } from "./application/services/chart-monitoring.service";
import { SignalHandlerService } from "./application/services/signal-handler.service";
import { ActiveProcessingService } from "./application/services/active-processing.service";
import { FirestorePurgeService } from "./application/services/firestore-purge.service";

/**
 * PROCESS 1: Firestore Purge Service
 * Runs independently, purges old data from Firestore collections
 */
const startFirestorePurgeService = async (
  config: AppConfig
): Promise<FirestorePurgeService> => {
  const firestorePurgeService = new FirestorePurgeService(config);
  await firestorePurgeService.initialize();
  console.log(`✅ Firestore purge service initialized`);
  return firestorePurgeService;
};

/**
 * PROCESS 2: Signal Processing Service
 * Connects to IQ Option SDK and processes trading signals
 */
const startSignalProcessingService = async (
  config: AppConfig
): Promise<ActiveProcessingService> => {
  // Initialize infrastructure layer
  const iqOptionClient = new IqOptionClient();

  // Initialize application layer
  const sdkService = new SdkService(iqOptionClient, config);

  // Set singleton instance for global access
  setSdkService(sdkService);

  // Initialize chart monitoring service
  const chartMonitoringService = new ChartMonitoringService(sdkService);

  // Initialize signal handler service (handles formatting and persistence)
  const signalHandlerService = new SignalHandlerService(sdkService);

  // Initialize active processing service
  const activeProcessingService = new ActiveProcessingService(
    sdkService,
    chartMonitoringService,
    config,
    signalHandlerService
  );

  // Set up callback to start active processing when SDK is connected
  // This must be done BEFORE initializing the SDK
  sdkService.onConnected(async () => {
    try {
      console.log(`🚀 SDK connected, starting active processing...`);
      // Initialize both timeframes in parallel for better performance
      activeProcessingService.initialize();

      console.log(`✅ Active processing initialized successfully`);
    } catch (error) {
      console.error(`❌ Failed to initialize active processing:`, error);
      console.error(error);
    }
  });

  // Initialize SDK connection
  await sdkService.initialize();
  console.log(`✅ Signal processing service initialized`);

  return activeProcessingService;
};

// Initialize application
const initialize = async () => {
  try {
    // Load configuration
    const config = createAppConfig();

    // Start both processes in parallel
    const [firestorePurgeService, activeProcessingService] = await Promise.all([
      startFirestorePurgeService(config),
      startSignalProcessingService(config),
    ]);

    // ========================================================================
    // Application Initialization Complete
    // ========================================================================
    console.log(`✅ Application initialized successfully`);

    // ========================================================================
    // Graceful Shutdown Handlers
    // ========================================================================
    process.on("SIGINT", () => {
      console.log(`\n🛑 Shutting down gracefully...`);
      activeProcessingService.stopAllProcessing();
      firestorePurgeService.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log(`\n🛑 Shutting down gracefully...`);
      activeProcessingService.stopAllProcessing();
      firestorePurgeService.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error(`❌ Failed to initialize application:`, error);
    process.exit(1);
  }
};

initialize();

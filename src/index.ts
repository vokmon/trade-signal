import { createAppConfig } from "./config/app.config";
import { IqOptionClient } from "./infrastructure/clients/iq-option-client";
import { SdkService } from "./application/services/sdk.service";
import { setSdkService } from "./application/services/sdk.service.singleton";
import { ChartMonitoringService } from "./application/services/chart-monitoring.service";
import { SignalHandlerService } from "./application/services/signal-handler.service";
import { ActiveProcessingService } from "./application/services/active-processing.service";

// Initialize application
const initialize = async () => {
  try {
    // Load configuration
    const config = createAppConfig();

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

    console.log(`✅ Application initialized successfully`);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log(`\n🛑 Shutting down gracefully...`);
      activeProcessingService.stopAllProcessing();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log(`\n🛑 Shutting down gracefully...`);
      activeProcessingService.stopAllProcessing();
      process.exit(0);
    });
  } catch (error) {
    console.error(`❌ Failed to initialize application:`, error);
    process.exit(1);
  }
};

initialize();

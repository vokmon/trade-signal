export interface AppConfig {
  iqOption: {
    username: string;
    password: string;
    httpApiUrl: string;
    platformId: string;
    webSocketUrl: string;
  };
  retry: {
    maxAttempts: number;
    delayMs: number;
  };
  trading: {
    candleNumber: number;
    candleAnalysisIntervalMs: number;
    activeRefreshIntervalMs: number;
  };
  firestore: {
    purgeIntervalMs: number;
    purgeRetentionHours: number;
  };
}

export const createAppConfig = (): AppConfig => {
  const username = process.env.IQ_OPTION_USERNAME;
  const password = process.env.IQ_OPTION_PASSWORD;
  const httpApiUrl = process.env.IQ_OPTION_HTTP_API_URL;
  const platformId = process.env.IQ_OPTION_PLATFORM_ID;
  const webSocketUrl = process.env.IQ_OPTION_WS_API_URL;

  if (!username || !password || !httpApiUrl || !platformId || !webSocketUrl) {
    throw new Error(
      "❌ Missing required environment variables for IQ Option configuration"
    );
  }

  return {
    iqOption: {
      username,
      password,
      httpApiUrl,
      platformId,
      webSocketUrl,
    },
    retry: {
      maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || "5", 10),
      delayMs: parseInt(process.env.RETRY_DELAY_MS || "3000", 10),
    },
    trading: {
      candleNumber: parseInt(process.env.CANDLE_NUMBER || "100", 10),
      candleAnalysisIntervalMs: parseInt(
        process.env.CANDLE_ANALYSIS_INTERVAL_MS || "5000",
        10
      ),
      activeRefreshIntervalMs: parseInt(
        process.env.ACTIVE_REFRESH_INTERVAL_MS || (60 * 60 * 1000).toString(),
        10
      ), // Default: 1 hour (3600000ms)
    },
    firestore: {
      purgeIntervalMs: parseInt(
        process.env.FIRESTORE_PURGE_INTERVAL_MS ||
          (6 * 60 * 60 * 1000).toString(),
        10
      ), // Default: 6 hours (21600000ms)
      purgeRetentionHours: parseInt(
        process.env.FIRESTORE_PURGE_RETENTION_HOURS || "6",
        10
      ), // Default: 6 hours
    },
  };
};

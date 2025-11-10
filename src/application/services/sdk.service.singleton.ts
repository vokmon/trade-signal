import type { SdkService } from "./sdk.service";

let sdkServiceInstance: SdkService | null = null;

export const getSdkService = (): SdkService => {
  if (!sdkServiceInstance) {
    throw new Error(
      "❌ SDK Service not initialized. Call initializeSdkService() first."
    );
  }
  return sdkServiceInstance;
};

export const setSdkService = (service: SdkService): void => {
  sdkServiceInstance = service;
};


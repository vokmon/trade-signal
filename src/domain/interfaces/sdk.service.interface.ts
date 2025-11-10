import type { ClientSdk } from "@quadcode-tech/client-sdk-js";

export interface ISdkService {
  initialize(): Promise<void>;
  getSdk(): ClientSdk | null;
  isConnected(): boolean;
  waitForConnection(): Promise<ClientSdk>;
}

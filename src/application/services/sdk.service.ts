import type { ClientSdk } from "@quadcode-tech/client-sdk-js";
import type { ISdkService } from "../../domain/interfaces/sdk.service.interface";
import type { IqOptionClient } from "../../infrastructure/clients/iq-option-client";
import type { AppConfig } from "../../config/app.config";

export class SdkService implements ISdkService {
  private sdk: ClientSdk | null = null;
  private isReconnecting = false;
  private retryCount = 0;
  private connectionPromise: Promise<ClientSdk> | null = null;
  private connectionResolve: ((sdk: ClientSdk) => void) | null = null;
  private connectionReject: ((error: Error) => void) | null = null;

  constructor(
    private readonly iqOptionClient: IqOptionClient,
    private readonly config: AppConfig
  ) {}

  async initialize(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      console.error(`❌ Initial connection failed:`, error);
      this.handleReconnection();
    }
  }

  getSdk(): ClientSdk | null {
    return this.sdk;
  }

  isConnected(): boolean {
    return this.sdk !== null;
  }

  async waitForConnection(): Promise<ClientSdk> {
    if (this.sdk) {
      return this.sdk;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = new Promise<ClientSdk>((resolve, reject) => {
        this.connectionResolve = resolve;
        this.connectionReject = reject;
      });
    }

    return this.connectionPromise;
  }

  private async connect(): Promise<ClientSdk> {
    console.log(
      `🔑 Login with: ${this.config.iqOption.username} on ${this.config.iqOption.httpApiUrl}`
    );

    this.sdk = await this.iqOptionClient.createSdk(this.config);

    await this.iqOptionClient.setupConnectionStateListener(
      this.sdk,
      () => this.handleReconnection(),
      () => {
        // Fire and forget - errors are handled inside notifyConnected
        this.notifyConnected().catch((error) => {
          console.error(`❌ Error in notifyConnected:`, error);
        });
      }
    );

    console.log(`✅ Successfully connected to WS`);
    // Await here since we're in an async function
    await this.notifyConnected();

    return this.sdk;
  }

  private onConnectedCallbacks: (() => void | Promise<void>)[] = [];

  onConnected(callback: () => void | Promise<void>): void {
    this.onConnectedCallbacks.push(callback);
  }

  private async notifyConnected(): Promise<void> {
    this.retryCount = 0;
    if (this.connectionResolve && this.sdk) {
      this.connectionResolve(this.sdk);
      this.connectionPromise = null;
      this.connectionResolve = null;
      this.connectionReject = null;
    }

    // Trigger all connected callbacks
    for (const callback of this.onConnectedCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error(`❌ Error in onConnected callback:`, error);
      }
    }
  }

  private async handleReconnection(): Promise<void> {
    if (this.isReconnecting) {
      console.log(`⏳ Reconnection already in progress, skipping...`);
      return;
    }

    if (this.retryCount >= this.config.retry.maxAttempts) {
      console.log(
        `❌ Max retry attempts (${this.config.retry.maxAttempts}) reached. Stopping reconnection attempts.`
      );
      if (this.connectionReject) {
        this.connectionReject(new Error("Max retry attempts reached"));
        this.connectionPromise = null;
        this.connectionResolve = null;
        this.connectionReject = null;
      }
      return;
    }

    this.isReconnecting = true;
    this.retryCount++;

    console.log(
      `🔄 Attempting to reconnect... (Attempt ${this.retryCount}/${this.config.retry.maxAttempts})`
    );

    try {
      await this.sleep(this.config.retry.delayMs);
      this.sdk = await this.connect();
      this.isReconnecting = false;
    } catch (error) {
      this.isReconnecting = false;
      console.error(
        `❌ Reconnection attempt ${this.retryCount} failed:`,
        error
      );

      if (this.retryCount < this.config.retry.maxAttempts) {
        console.log(
          `⏳ Waiting ${this.config.retry.delayMs}ms before next retry...`
        );
        await this.handleReconnection();
      } else {
        console.log(
          `❌ All reconnection attempts exhausted. Please check your connection and credentials.`
        );
        if (this.connectionReject) {
          this.connectionReject(error as Error);
          this.connectionPromise = null;
          this.connectionResolve = null;
          this.connectionReject = null;
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

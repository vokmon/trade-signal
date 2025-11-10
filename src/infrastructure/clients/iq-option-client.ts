import {
  ClientSdk,
  LoginPasswordAuthMethod,
  WsConnectionStateEnum,
} from "@quadcode-tech/client-sdk-js";
import type { AppConfig } from "../../config/app.config";

export class IqOptionClient {
  async createSdk(config: AppConfig): Promise<ClientSdk> {
    return ClientSdk.create(
      config.iqOption.webSocketUrl,
      Number(config.iqOption.platformId),
      new LoginPasswordAuthMethod(
        config.iqOption.httpApiUrl,
        config.iqOption.username,
        config.iqOption.password
      )
    );
  }

  async setupConnectionStateListener(
    sdk: ClientSdk,
    onDisconnected: () => void,
    onConnected: () => void
  ): Promise<void> {
    const wsConnectionState = await sdk.wsConnectionState();

    wsConnectionState.subscribeOnStateChanged(
      (state: WsConnectionStateEnum) => {
        console.log(`🔄 WS Connection State:`, state);
        if (state === WsConnectionStateEnum.Disconnected) {
          console.log(`❌ WS Connection Disconnected`);
          onDisconnected();
        } else if (state === WsConnectionStateEnum.Connected) {
          console.log(`✅ WS Connection Reconnected`);
          onConnected();
        }
      }
    );
  }
}

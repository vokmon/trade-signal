import type { IChartMonitoringService } from "../../domain/interfaces/chart-monitoring.service.interface";
import type { ISdkService } from "../../domain/interfaces/sdk.service.interface";

export class ChartMonitoringService implements IChartMonitoringService {
  constructor(private readonly sdkService: ISdkService) {}

  async getChartLayer(activeId: number, candleSize: number): Promise<any> {
    const sdk = await this.sdkService.waitForConnection();

    // console.log(
    //   `📈 Creating chart layer for active ${activeId} with candle size ${candleSize}s`
    // );

    // Create real-time chart data layer
    const chartLayer = await sdk.realTimeChartDataLayer(activeId, candleSize);

    return chartLayer;
  }
}

export interface IChartMonitoringService {
  getChartLayer(activeId: number, candleSize: number): Promise<any>;
}

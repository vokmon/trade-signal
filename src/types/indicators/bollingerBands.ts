export interface BollingerBandsData {
  time: number;
  middle: number;
  upper: number;
  lower: number;
}

export interface BollingerBandsConfig {
  period: number; // Default: 20
  stdDev: number; // Default: 2
}

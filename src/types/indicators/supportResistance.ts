export interface SupportResistanceData {
  time: number;
  resistance: number | null;
  support: number | null;
}

export interface SupportResistanceConfig {
  boxPeriod: number; // Default: 25
}

export interface CandlestickData {
  time: number;
  max: number; // high price
  min: number; // low price
}

export interface StochasticData {
  time: number;
  k: number; // %K line
  d: number; // %D line (smoothed %K)
}

export interface StochasticConfig {
  kPeriod: number; // %K period (default: 14)
  dPeriod: number; // %D period (default: 3)
  smoothing: number; // Smoothing factor for %K (default: 1)
}

export interface DonchianData {
  time: number;
  upper: number;
  lower: number;
  middle: number;
}

export interface DonchianConfig {
  period: number; // Default: 20
}

import { SignalType } from "../../../types/signal/Signal.ts";
import { calculateSupportResistance } from "./supportResistance";
import { calculateDonchianForCandles } from "./donchian";
import { calculateBollingerBandsForCandles } from "./bollingerBands";
import { calculateStochasticForCandles } from "./stochastic";
import { calculateRSIForCandles } from "./rsi";
import { calculateConsecutiveCandleColors } from "./consecutiveCandleColors";
import { Candle } from "@quadcode-tech/client-sdk-js";

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SignalCalculationConfig {
  supportResistancePeriod?: number; // Default: 25
  donchianPeriod?: number; // Default: 20
  bollingerPeriod?: number; // Default: 14
  bollingerStdDev?: number; // Default: 2
  stochasticKPeriod?: number; // Default: 13
  stochasticDPeriod?: number; // Default: 3
  stochasticSmoothing?: number; // Default: 3
  rsiPeriod?: number; // Default: 14
  minCandles?: number; // Default: 20
}

export interface SignalResult {
  signal: SignalType;
  details: {
    isNearResistance: boolean;
    isNearSupport: boolean;
    resistanceZoneHeight: number;
    supportZoneHeight: number;
    resistanceZonePosition: number; // 0-1, how close to resistance
    supportZonePosition: number; // 0-1, how close to support
    donchianBreakout: {
      upper: boolean;
      lower: boolean;
    };
    bollingerPosition: {
      aboveUpper: boolean;
      belowLower: boolean;
    };
    stochasticPosition: {
      overbought: boolean;
      oversold: boolean;
      kValue: number;
    };
    consecutiveCandles: number;
    rsiValue: number;
    aboveUpperBB: boolean;
    belowLowerBB: boolean;
  };
}

/**
 * Calculate trading signal based on multiple technical indicators
 * Implements the exact logic from the Python signal-generator.py script
 * @param candles Array of candlestick data (minimum 20, recommended 100)
 * @param config Configuration for indicators
 * @returns Signal result with type and confidence
 */
export function calculateSignal(
  candles: Candle[],
  config: SignalCalculationConfig = {}
): SignalResult {
  const {
    supportResistancePeriod = 25,
    donchianPeriod = 20,
    bollingerPeriod = 14,
    bollingerStdDev = 2,
    stochasticKPeriod = 13,
    stochasticDPeriod = 3,
    stochasticSmoothing = 3,
    rsiPeriod = 14,
    minCandles = 20,
  } = config;

  // Check minimum data requirement
  if (candles.length < minCandles) {
    console.log("Not enough candles to calculate signal");
    return {
      signal: SignalType.HOLD,
      details: {
        isNearResistance: false,
        isNearSupport: false,
        resistanceZoneHeight: 0,
        supportZoneHeight: 0,
        resistanceZonePosition: 0,
        supportZonePosition: 0,
        donchianBreakout: { upper: false, lower: false },
        bollingerPosition: { aboveUpper: false, belowLower: false },
        stochasticPosition: { overbought: false, oversold: false, kValue: 0 },
        consecutiveCandles: 0,
        rsiValue: 0,
        aboveUpperBB: false,
        belowLowerBB: false,
      },
    };
  }

  // Calculate all indicators
  const supportResistanceData = calculateSupportResistance(candles, {
    boxPeriod: supportResistancePeriod,
  });

  const donchianData = calculateDonchianForCandles(candles, {
    period: donchianPeriod,
  });

  const bollingerData = calculateBollingerBandsForCandles(candles, {
    period: bollingerPeriod,
    stdDev: bollingerStdDev,
  });

  const stochasticData = calculateStochasticForCandles(candles, {
    kPeriod: stochasticKPeriod,
    dPeriod: stochasticDPeriod,
    smoothing: stochasticSmoothing,
  });

  const rsiData = calculateRSIForCandles(candles, {
    period: rsiPeriod,
  });

  const consecutiveData = calculateConsecutiveCandleColors(candles);

  // Get the last values (most recent candle)
  const lastCandle = candles[candles.length - 1];
  const lastSR = supportResistanceData[supportResistanceData.length - 1];
  const lastDonchian = donchianData[donchianData.length - 1];
  const lastBollinger = bollingerData[bollingerData.length - 1];
  const lastStochastic = stochasticData[stochasticData.length - 1];
  const lastRSI = rsiData[rsiData.length - 1];
  const lastConsecutive = consecutiveData[consecutiveData.length - 1];

  // Check if we have valid data
  if (
    !lastSR ||
    !lastDonchian ||
    !lastBollinger ||
    !lastStochastic ||
    !lastRSI ||
    !lastConsecutive ||
    lastSR.resistance === null ||
    lastSR.support === null
  ) {
    return {
      signal: SignalType.HOLD,
      details: {
        isNearResistance: false,
        isNearSupport: false,
        resistanceZoneHeight: 0,
        supportZoneHeight: 0,
        resistanceZonePosition: 0,
        supportZonePosition: 0,
        donchianBreakout: { upper: false, lower: false },
        bollingerPosition: { aboveUpper: false, belowLower: false },
        stochasticPosition: { overbought: false, oversold: false, kValue: 0 },
        consecutiveCandles: 0,
        rsiValue: 0,
        aboveUpperBB: false,
        belowLowerBB: false,
      },
    };
  }

  // Calculate support/resistance zones
  const midSRPut = (lastSR.resistance + lastSR.support) / 2;
  const upperZoneHeight = lastSR.resistance - midSRPut;
  const isNearResistance =
    upperZoneHeight > 0 &&
    (lastCandle!.max - midSRPut) / upperZoneHeight >= 0.9;

  const midSRCall = (lastSR.resistance + lastSR.support) / 2;
  const lowerZoneHeight = midSRCall - lastSR.support;
  const isNearSupport =
    lowerZoneHeight > 0 &&
    (midSRCall - lastCandle!.min) / lowerZoneHeight >= 0.9;

  // Get previous Donchian values for breakout detection
  const prevDonchian = donchianData[donchianData.length - 2];
  const prevUpperDC = prevDonchian?.upper;
  const prevLowerDC = prevDonchian?.lower;

  // Check Donchian breakouts
  const donchianUpperBreakout =
    prevUpperDC !== undefined && lastCandle!.max > prevUpperDC;
  const donchianLowerBreakout =
    prevLowerDC !== undefined && lastCandle!.min < prevLowerDC;

  // Check Bollinger Bands position
  const aboveUpperBB = lastCandle!.max > lastBollinger.upper;
  const belowLowerBB = lastCandle!.min < lastBollinger.lower;

  // Check Stochastic position
  const stochasticOverbought = lastStochastic.k > 80;
  const stochasticOversold = lastStochastic.k < 20;

  // Check consecutive candles
  const consecutiveCandles = lastConsecutive.consecutiveColors;

  // SELL Signal Conditions (Resistance Zone) - ALL must be true
  const putConditionsMet =
    isNearResistance &&
    prevUpperDC !== undefined &&
    donchianUpperBreakout &&
    aboveUpperBB &&
    stochasticOverbought &&
    consecutiveCandles >= 3;

  // BUY Signal Conditions (Support Zone) - ALL must be true
  const callConditionsMet =
    isNearSupport &&
    prevLowerDC !== undefined &&
    donchianLowerBreakout &&
    belowLowerBB &&
    stochasticOversold &&
    consecutiveCandles <= -3;

  // Determine signal - binary logic matching Python script
  let signal: SignalType;
  if (putConditionsMet) {
    signal = SignalType.PUT;
  } else if (callConditionsMet) {
    signal = SignalType.CALL;
  } else {
    signal = SignalType.HOLD;
  }

  return {
    signal,
    details: {
      isNearResistance,
      isNearSupport,
      resistanceZoneHeight: upperZoneHeight,
      supportZoneHeight: lowerZoneHeight,
      resistanceZonePosition:
        upperZoneHeight > 0
          ? (lastCandle!.max - midSRPut) / upperZoneHeight
          : 0,
      supportZonePosition:
        lowerZoneHeight > 0
          ? (midSRCall - lastCandle!.min) / lowerZoneHeight
          : 0,
      donchianBreakout: {
        upper: donchianUpperBreakout,
        lower: donchianLowerBreakout,
      },
      bollingerPosition: {
        aboveUpper: aboveUpperBB,
        belowLower: belowLowerBB,
      },
      stochasticPosition: {
        overbought: stochasticOverbought,
        oversold: stochasticOversold,
        kValue: lastStochastic.k,
      },
      consecutiveCandles,
      rsiValue: lastRSI.rsi,
      aboveUpperBB,
      belowLowerBB,
    },
  };
}

/**
 * Calculate signal with default configuration matching Python script
 * @param candles Array of candlestick data (minimum 20, recommended 100)
 * @returns Signal result
 */
export function calculateSignalWithDefaults(candles: Candle[]): SignalResult {
  return calculateSignal(candles, {
    supportResistancePeriod: 25,
    donchianPeriod: 20,
    bollingerPeriod: 14,
    bollingerStdDev: 2,
    stochasticKPeriod: 13,
    stochasticDPeriod: 3,
    stochasticSmoothing: 3,
    rsiPeriod: 14,
    minCandles: 20,
  });
}

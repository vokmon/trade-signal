# Trade Signal Generator

A real-time trading signal generator that monitors IQ Option assets and generates BUY/SELL signals based on multiple technical indicators.

## Overview

This application connects to IQ Option's trading platform, monitors candlestick data for various assets, and calculates trading signals using a combination of technical indicators. Signals are generated when specific conditions are met and can be persisted to Firestore for further analysis.

## Features

- **Real-time Market Monitoring**: Connects to IQ Option via WebSocket to monitor live market data
- **Multi-Timeframe Analysis**: Supports 1-minute and 5-minute timeframes
- **Technical Indicators**:
  - Bollinger Bands
  - RSI (Relative Strength Index)
  - Stochastic Oscillator
  - Donchian Channels
  - Support/Resistance Zones
  - Consecutive Candle Colors
- **Signal Generation**: Generates BUY/SELL signals based on multiple indicator conditions
- **Firestore Integration**: Persists signals to Firebase Firestore (main and OTC projects)
- **Graceful Shutdown**: Handles SIGINT and SIGTERM for clean application termination

## Architecture

The project follows a clean architecture pattern with three main layers:

- **Domain Layer** (`src/domain/`): Interfaces and type definitions
- **Application Layer** (`src/application/`): Business logic, services, and processors
- **Infrastructure Layer** (`src/infrastructure/`): External clients and Firebase integration

## Prerequisites

- [Bun](https://bun.sh/) runtime (v1.0+)
- IQ Option account credentials
- Firebase project(s) with Firestore enabled

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd trade-signal
```

2. Install dependencies:

```bash
bun install
```

3. Copy the environment example file and configure it:

```bash
cp env.example .env
```

4. Edit `.env` with your credentials (see [Configuration](#configuration) section)

## Configuration

Create a `.env` file in the root directory with the following variables:

### Required Variables

#### IQ Option Configuration

- `IQ_OPTION_USERNAME`: Your IQ Option username
- `IQ_OPTION_PASSWORD`: Your IQ Option password
- `IQ_OPTION_HTTP_API_URL`: IQ Option HTTP API endpoint
- `IQ_OPTION_PLATFORM_ID`: IQ Option platform ID
- `IQ_OPTION_WS_API_URL`: IQ Option WebSocket API endpoint

#### Firebase Configuration (Main Project)

- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key

#### Firebase Configuration (OTC Project)

- `FIREBASE_PROJECT_ID_OTC`: Firebase OTC project ID
- `FIREBASE_CLIENT_EMAIL_OTC`: Firebase OTC service account email
- `FIREBASE_PRIVATE_KEY_OTC`: Firebase OTC service account private key

### Optional Variables

- `MAX_RETRY_ATTEMPTS`: Maximum retry attempts for operations (default: `5`)
- `RETRY_DELAY_MS`: Delay between retries in milliseconds (default: `3000`)
- `CANDLE_NUMBER`: Number of candles to analyze (default: `100`)
- `CANDLE_ANALYSIS_INTERVAL_MS`: Interval between candle analysis in milliseconds (default: `5000`)
- `ACTIVE_REFRESH_INTERVAL_MS`: Interval for refreshing active assets in milliseconds (default: `3600000` - 1 hour)

See `env.example` for a template.

## Usage

Start the application:

```bash
bun start
```

Or use the npm script:

```bash
bun run start
```

The application will:

1. Load configuration from environment variables
2. Initialize IQ Option SDK connection
3. Start monitoring charts for active assets
4. Calculate indicators and generate signals
5. Log formatted signals to console
6. Persist signals to Firestore (when implemented)

## Signal Generation Logic

### BUY Signal (CALL)

A BUY signal is generated when ALL of the following conditions are met:

- Price is near support zone (within 90% of support zone)
- Donchian lower channel breakout detected
- Price is below lower Bollinger Band
- Stochastic oscillator is oversold (K < 20)
- At least 3 consecutive bearish candles

### SELL Signal (PUT)

A SELL signal is generated when ALL of the following conditions are met:

- Price is near resistance zone (within 90% of resistance zone)
- Donchian upper channel breakout detected
- Price is above upper Bollinger Band
- Stochastic oscillator is overbought (K > 80)
- At least 3 consecutive bullish candles

### HOLD Signal

If neither BUY nor SELL conditions are met, the signal is HOLD.

## Project Structure

```
src/
├── application/          # Application layer
│   ├── processors/       # Signal processing and formatting
│   └── services/         # Business logic services
├── config/              # Application configuration
├── domain/              # Domain layer (interfaces)
│   └── interfaces/      # Service interfaces
├── infrastructure/      # Infrastructure layer
│   ├── clients/         # External API clients
│   └── firebase/        # Firebase integration
├── types/               # Type definitions
│   ├── indicators/      # Indicator types
│   └── signal/          # Signal types
└── index.ts             # Application entry point
```

## Dependencies

- `@quadcode-tech/client-sdk-js`: IQ Option client SDK
- `firebase-admin`: Firebase Admin SDK for server-side operations
- `typescript`: TypeScript compiler

## Development

The project uses:

- **Bun** as the runtime and package manager
- **TypeScript** for type safety
- Clean architecture principles for maintainability

## License

This software is proprietary and confidential. All rights reserved.

See [LICENSE](LICENSE) file for details.

## Disclaimer

This software is for educational purposes only. Trading involves risk, and past performance does not guarantee future results. Always do your own research and consider consulting with a financial advisor before making trading decisions.

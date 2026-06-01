# Pocket Option Forex Trading Bot 🤖💹

A professional-grade automated forex trading bot for Pocket Option with advanced analysis strategies, real-time signal generation, and live market execution.

## Features ✨

- **Multi-Strategy Analysis**: RSI, MACD, Bollinger Bands, Moving Averages, Stochastic, ATR
- **High Confidence Filtering**: Only executes trades with ≥90% confidence signals
- **1-Minute Expiration**: Optimized for fast binary options trading
- **Real-time Market Data**: Live WebSocket connections to market feeds
- **Smart Decision Engine**: AI-driven buy/sell decision making
- **Risk Management**: Dynamic position sizing and stop-loss calculation
- **Signal Notifications**: Telegram alerts for all trade signals
- **Performance Tracking**: Trade history and win rate analytics
- **Adaptive Strategies**: Machine learning-based strategy optimization
- **Multi-Asset Support**: 40+ forex pairs coverage

## Supported Forex Pairs 🌍

### Major Pairs (High Liquidity)
- EUR/USD, GBP/USD, USD/JPY, USD/CHF, USD/CAD, AUD/USD, NZD/USD

### Cross Pairs
- EUR/GBP, EUR/JPY, EUR/CHF, EUR/AUD, EUR/CAD, EUR/NZD
- GBP/JPY, GBP/CHF, GBP/AUD, GBP/CAD, GBP/NZD
- JPY/CHF, AUD/JPY, CAD/JPY, NZD/JPY

### Exotic & Commodity Pairs
- USD/CNH, USD/HKD, USD/SGD, USD/INR, USD/TRY, USD/ZAR
- XAU/USD (Gold), XAG/USD (Silver), WTI/USD (Crude Oil), Brent/USD

## Installation 📦

```bash
# Clone repository
git clone https://github.com/hamzehmsabdi-ai/forex-bot.git
cd forex-bot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration ⚙️

1. Copy `config.example.env` to `.env`
2. Add your Pocket Option API credentials
3. Configure Telegram webhook for notifications
4. Set risk parameters and trading hours

## Usage 🚀

```bash
# Start the bot
python main.py

# Run with debug logging
python main.py --debug

# Backtest strategies
python backtest.py --pair EUR/USD --days 30
```

## Strategy Documentation 📊

See [STRATEGIES.md](STRATEGIES.md) for detailed strategy descriptions and parameters.

## Performance Analytics 📈

Historical win rates and performance metrics stored in `data/performance.json`.

## License

MIT License - See LICENSE file for details

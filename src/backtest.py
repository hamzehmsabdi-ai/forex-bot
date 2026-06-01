"""
Backtest module for strategy validation
"""

import numpy as np
from typing import List, Tuple
from datetime import datetime, timedelta
import logging

from src.market_data import Candle
from src.strategies import StrategiesManager

logger = logging.getLogger(__name__)


class BacktestEngine:
    """Backtesting engine for strategy validation"""
    
    def __init__(self, initial_capital: float = 1000):
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.trades = []
        self.results = {}
    
    def generate_sample_data(self, trend: str = "up", volatility: float = 0.01, 
                           num_candles: int = 500) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Generate synthetic market data for testing"""
        closes = np.zeros(num_candles)
        closes[0] = 1.0900
        
        for i in range(1, num_candles):
            if trend == "up":
                drift = 0.0002
            elif trend == "down":
                drift = -0.0002
            else:
                drift = 0
            
            change = drift + np.random.normal(0, volatility)
            closes[i] = closes[i-1] * (1 + change)
        
        highs = closes + np.abs(np.random.normal(0, volatility, num_candles))
        lows = closes - np.abs(np.random.normal(0, volatility, num_candles))
        opens = np.concatenate(([closes[0]], closes[:-1]))
        
        return opens, highs, lows, closes
    
    def run_backtest(self, pair: str, candle_data: Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray],
                    min_confidence: float = 0.90) -> dict:
        """Run backtest on candle data"""
        opens, highs, lows, closes = candle_data
        
        trades = []
        position = None
        
        logger.info(f"Running backtest for {pair} with {len(closes)} candles")
        
        # Sliding window analysis
        window_size = 50
        for i in range(window_size, len(closes)):
            window_opens = opens[max(0, i-window_size):i+1]
            window_highs = highs[max(0, i-window_size):i+1]
            window_lows = lows[max(0, i-window_size):i+1]
            window_closes = closes[max(0, i-window_size):i+1]
            
            # Get signal
            result = StrategiesManager.get_best_signal(
                window_highs, window_lows, window_closes,
                min_confidence=min_confidence
            )
            
            signal = result["signal"]
            confidence = result["confidence"]
            
            if signal != "HOLD" and confidence >= min_confidence:
                if position is None:
                    # Open position
                    position = {
                        "entry_price": closes[i],
                        "signal": signal,
                        "entry_time": i,
                        "confidence": confidence
                    }
                elif (signal == "BUY" and position["signal"] == "SELL") or \
                     (signal == "SELL" and position["signal"] == "BUY"):
                    # Close position and open new one
                    trade = self._close_trade(position, closes[i], i)
                    trades.append(trade)
                    position = {
                        "entry_price": closes[i],
                        "signal": signal,
                        "entry_time": i,
                        "confidence": confidence
                    }
        
        # Close final position
        if position:
            trade = self._close_trade(position, closes[-1], len(closes)-1)
            trades.append(trade)
        
        return self._calculate_stats(pair, trades)
    
    def _close_trade(self, position: dict, exit_price: float, exit_time: int) -> dict:
        """Close a trade and calculate P&L"""
        entry_price = position["entry_price"]
        
        if position["signal"] == "BUY":
            pnl = exit_price - entry_price
        else:  # SELL
            pnl = entry_price - exit_price
        
        return {
            "signal": position["signal"],
            "entry_price": entry_price,
            "exit_price": exit_price,
            "duration": exit_time - position["entry_time"],
            "pnl": pnl,
            "pnl_pct": pnl / entry_price * 100,
            "won": pnl > 0,
            "confidence": position["confidence"]
        }
    
    def _calculate_stats(self, pair: str, trades: List[dict]) -> dict:
        """Calculate backtest statistics"""
        if not trades:
            return {
                "pair": pair,
                "total_trades": 0,
                "win_rate": 0,
                "avg_pnl": 0,
                "total_pnl": 0,
                "max_drawdown": 0
            }
        
        total_trades = len(trades)
        wins = sum(1 for t in trades if t["won"])
        losses = total_trades - wins
        win_rate = wins / total_trades if total_trades > 0 else 0
        
        total_pnl = sum(t["pnl"] for t in trades)
        avg_pnl = total_pnl / total_trades
        
        # Calculate max drawdown
        cumulative_pnl = 0
        max_balance = self.initial_capital
        max_drawdown = 0
        
        for trade in trades:
            cumulative_pnl += trade["pnl"]
            current_balance = self.initial_capital + cumulative_pnl
            
            if current_balance > max_balance:
                max_balance = current_balance
            
            drawdown = (max_balance - current_balance) / max_balance * 100
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        return {
            "pair": pair,
            "total_trades": total_trades,
            "wins": wins,
            "losses": losses,
            "win_rate": win_rate,
            "total_pnl": total_pnl,
            "avg_pnl": avg_pnl,
            "max_drawdown": max_drawdown,
            "trades": trades
        }


if __name__ == "__main__":
    # Example backtest
    engine = BacktestEngine()
    
    # Generate synthetic data
    data = engine.generate_sample_data("up", volatility=0.005, num_candles=500)
    
    # Run backtest
    results = engine.run_backtest("EUR/USD", data, min_confidence=0.90)
    
    print(f"\n{'='*60}")
    print(f"Backtest Results for {results['pair']}")
    print(f"{'='*60}")
    print(f"Total Trades: {results['total_trades']}")
    print(f"Wins: {results['wins']}, Losses: {results['losses']}")
    print(f"Win Rate: {results['win_rate']:.2%}")
    print(f"Total P&L: ${results['total_pnl']:.2f}")
    print(f"Avg P&L per Trade: ${results['avg_pnl']:.2f}")
    print(f"Max Drawdown: {results['max_drawdown']:.2f}%")
    print(f"{'='*60}\n")

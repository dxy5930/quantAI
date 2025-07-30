"""
数据分析服务 - 使用 pandas 进行股票数据分析
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class DataAnalyzer:
    """股票数据分析器"""
    
    def __init__(self):
        self.cache = {}
    
    def analyze_stock_performance(self, stock_data: List[Dict]) -> Dict[str, Any]:
        """
        分析股票表现
        
        Args:
            stock_data: 股票数据列表，包含 date, open, high, low, close, volume
            
        Returns:
            分析结果字典
        """
        try:
            # 转换为 DataFrame
            df = pd.DataFrame(stock_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # 计算技术指标
            df['returns'] = df['close'].pct_change()
            df['sma_20'] = df['close'].rolling(window=20).mean()
            df['sma_50'] = df['close'].rolling(window=50).mean()
            df['volatility'] = df['returns'].rolling(window=20).std() * np.sqrt(252)
            
            # RSI 计算
            df['rsi'] = self._calculate_rsi(df['close'])
            
            # MACD 计算
            macd_data = self._calculate_macd(df['close'])
            df['macd'] = macd_data['macd']
            df['macd_signal'] = macd_data['signal']
            df['macd_histogram'] = macd_data['histogram']
            
            # 布林带
            bollinger = self._calculate_bollinger_bands(df['close'])
            df['bb_upper'] = bollinger['upper']
            df['bb_middle'] = bollinger['middle']
            df['bb_lower'] = bollinger['lower']
            
            # 统计分析
            analysis = {
                'total_return': (df['close'].iloc[-1] / df['close'].iloc[0] - 1) * 100,
                'annualized_return': self._calculate_annualized_return(df['returns']),
                'volatility': df['volatility'].iloc[-1] * 100,
                'sharpe_ratio': self._calculate_sharpe_ratio(df['returns']),
                'max_drawdown': self._calculate_max_drawdown(df['close']),
                'current_rsi': df['rsi'].iloc[-1],
                'trend_signal': self._get_trend_signal(df),
                'support_resistance': self._find_support_resistance(df),
                'technical_indicators': {
                    'sma_20': df['sma_20'].iloc[-1],
                    'sma_50': df['sma_50'].iloc[-1],
                    'macd': df['macd'].iloc[-1],
                    'macd_signal': df['macd_signal'].iloc[-1],
                    'bb_position': self._get_bollinger_position(df)
                }
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"股票分析失败: {str(e)}")
            raise
    
    def analyze_portfolio(self, portfolio_data: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """
        分析投资组合
        
        Args:
            portfolio_data: 投资组合数据，key为股票代码，value为价格数据
            
        Returns:
            组合分析结果
        """
        try:
            # 构建价格矩阵
            price_dfs = {}
            for symbol, data in portfolio_data.items():
                df = pd.DataFrame(data)
                df['date'] = pd.to_datetime(df['date'])
                df = df.set_index('date')['close']
                price_dfs[symbol] = df
            
            # 合并所有股票数据
            prices = pd.DataFrame(price_dfs)
            returns = prices.pct_change().dropna()
            
            # 计算相关性矩阵
            correlation_matrix = returns.corr()
            
            # 计算组合统计
            portfolio_return = returns.mean().mean() * 252  # 年化收益
            portfolio_vol = returns.std().mean() * np.sqrt(252)  # 年化波动率
            
            # 计算最优权重（简化版本）
            optimal_weights = self._calculate_optimal_weights(returns)
            
            analysis = {
                'portfolio_return': portfolio_return * 100,
                'portfolio_volatility': portfolio_vol * 100,
                'sharpe_ratio': portfolio_return / portfolio_vol if portfolio_vol > 0 else 0,
                'correlation_matrix': correlation_matrix.to_dict(),
                'optimal_weights': optimal_weights,
                'diversification_ratio': self._calculate_diversification_ratio(returns),
                'var_95': self._calculate_var(returns, 0.05) * 100,
                'expected_shortfall': self._calculate_expected_shortfall(returns, 0.05) * 100
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"组合分析失败: {str(e)}")
            raise
    
    def _calculate_rsi(self, prices: pd.Series, window: int = 14) -> pd.Series:
        """计算 RSI 指标"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_macd(self, prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict:
        """计算 MACD 指标"""
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        macd_histogram = macd - macd_signal
        
        return {
            'macd': macd,
            'signal': macd_signal,
            'histogram': macd_histogram
        }
    
    def _calculate_bollinger_bands(self, prices: pd.Series, window: int = 20, num_std: float = 2) -> Dict:
        """计算布林带"""
        sma = prices.rolling(window=window).mean()
        std = prices.rolling(window=window).std()
        
        return {
            'upper': sma + (std * num_std),
            'middle': sma,
            'lower': sma - (std * num_std)
        }
    
    def _calculate_annualized_return(self, returns: pd.Series) -> float:
        """计算年化收益率"""
        mean_return = returns.mean()
        base = 1 + mean_return
        
        # 防止极端情况产生无穷大值
        if base <= 0:
            return -0.9999  # 最大亏损99.99%
        
        try:
            result = base ** 252 - 1
            # 限制年化收益率的最大值，避免无穷大
            if result > 99.99:
                return 99.99
            elif result < -0.9999:
                return -0.9999
            return result
        except (OverflowError, ValueError):
            return 99.99 if base > 1 else -0.9999
    
    def _calculate_sharpe_ratio(self, returns: pd.Series, risk_free_rate: float = 0.02) -> float:
        """计算夏普比率"""
        excess_returns = returns.mean() * 252 - risk_free_rate
        volatility = returns.std() * np.sqrt(252)
        return excess_returns / volatility if volatility > 0 else 0
    
    def _calculate_max_drawdown(self, prices: pd.Series) -> float:
        """计算最大回撤"""
        cumulative = (1 + prices.pct_change()).cumprod()
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        return drawdown.min() * 100
    
    def _get_trend_signal(self, df: pd.DataFrame) -> str:
        """获取趋势信号"""
        current_price = df['close'].iloc[-1]
        sma_20 = df['sma_20'].iloc[-1]
        sma_50 = df['sma_50'].iloc[-1]
        
        if current_price > sma_20 > sma_50:
            return "强势上涨"
        elif current_price > sma_20 and sma_20 < sma_50:
            return "弱势上涨"
        elif current_price < sma_20 < sma_50:
            return "强势下跌"
        else:
            return "弱势下跌"
    
    def _find_support_resistance(self, df: pd.DataFrame) -> Dict:
        """寻找支撑阻力位"""
        highs = df['high'].rolling(window=10).max()
        lows = df['low'].rolling(window=10).min()
        
        resistance = highs.iloc[-20:].max()
        support = lows.iloc[-20:].min()
        
        return {
            'resistance': resistance,
            'support': support
        }
    
    def _get_bollinger_position(self, df: pd.DataFrame) -> str:
        """获取布林带位置"""
        current_price = df['close'].iloc[-1]
        bb_upper = df['bb_upper'].iloc[-1]
        bb_lower = df['bb_lower'].iloc[-1]
        bb_middle = df['bb_middle'].iloc[-1]
        
        if current_price > bb_upper:
            return "超买区域"
        elif current_price < bb_lower:
            return "超卖区域"
        elif current_price > bb_middle:
            return "中上轨区域"
        else:
            return "中下轨区域"
    
    def _calculate_optimal_weights(self, returns: pd.DataFrame) -> Dict:
        """计算最优权重（等权重简化版本）"""
        n_assets = len(returns.columns)
        equal_weight = 1.0 / n_assets
        
        return {symbol: equal_weight for symbol in returns.columns}
    
    def _calculate_diversification_ratio(self, returns: pd.DataFrame) -> float:
        """计算分散化比率"""
        weights = np.array([1/len(returns.columns)] * len(returns.columns))
        portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(returns.cov() * 252, weights)))
        weighted_avg_vol = np.sum(weights * returns.std() * np.sqrt(252))
        
        return weighted_avg_vol / portfolio_vol if portfolio_vol > 0 else 1.0
    
    def _calculate_var(self, returns: pd.DataFrame, confidence_level: float) -> float:
        """计算风险价值 VaR"""
        portfolio_returns = returns.mean(axis=1)
        return np.percentile(portfolio_returns, confidence_level * 100)
    
    def _calculate_expected_shortfall(self, returns: pd.DataFrame, confidence_level: float) -> float:
        """计算期望损失 ES"""
        portfolio_returns = returns.mean(axis=1)
        var = self._calculate_var(returns, confidence_level)
        return portfolio_returns[portfolio_returns <= var].mean()
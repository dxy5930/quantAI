"""
辅助工具函数
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def validate_date_range(start_date: str, end_date: str) -> tuple:
    """
    验证日期范围
    
    Args:
        start_date: 开始日期字符串
        end_date: 结束日期字符串
        
    Returns:
        (start_datetime, end_datetime) 元组
        
    Raises:
        ValueError: 日期格式错误或范围无效
    """
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        if start_dt >= end_dt:
            raise ValueError("开始日期必须早于结束日期")
        
        if end_dt > datetime.now():
            raise ValueError("结束日期不能超过当前日期")
        
        return start_dt, end_dt
        
    except ValueError as e:
        if "time data" in str(e):
            raise ValueError("日期格式错误，请使用 YYYY-MM-DD 格式")
        raise

def calculate_trading_days(start_date: datetime, end_date: datetime) -> int:
    """
    计算交易日数量（简化版本，不考虑节假日）
    
    Args:
        start_date: 开始日期
        end_date: 结束日期
        
    Returns:
        交易日数量
    """
    total_days = (end_date - start_date).days
    # 简化计算：假设每周5个交易日
    return int(total_days * 5 / 7)

def normalize_symbol(symbol: str) -> str:
    """
    标准化股票代码
    
    Args:
        symbol: 原始股票代码
        
    Returns:
        标准化后的股票代码
    """
    return symbol.upper().strip()

def calculate_returns(prices: List[float]) -> List[float]:
    """
    计算收益率序列
    
    Args:
        prices: 价格序列
        
    Returns:
        收益率序列
    """
    if len(prices) < 2:
        return []
    
    returns = []
    for i in range(1, len(prices)):
        ret = (prices[i] - prices[i-1]) / prices[i-1]
        returns.append(ret)
    
    return returns

def calculate_cumulative_returns(returns: List[float]) -> List[float]:
    """
    计算累积收益率
    
    Args:
        returns: 收益率序列
        
    Returns:
        累积收益率序列
    """
    cumulative = [1.0]  # 起始值为1
    
    for ret in returns:
        cumulative.append(cumulative[-1] * (1 + ret))
    
    return cumulative

def format_percentage(value: float, decimals: int = 2) -> str:
    """
    格式化百分比显示
    
    Args:
        value: 数值（如0.1234表示12.34%）
        decimals: 小数位数
        
    Returns:
        格式化后的百分比字符串
    """
    return f"{value * 100:.{decimals}f}%"

def format_currency(value: float, currency: str = "¥") -> str:
    """
    格式化货币显示
    
    Args:
        value: 金额
        currency: 货币符号
        
    Returns:
        格式化后的货币字符串
    """
    if abs(value) >= 1e8:
        return f"{currency}{value/1e8:.2f}亿"
    elif abs(value) >= 1e4:
        return f"{currency}{value/1e4:.2f}万"
    else:
        return f"{currency}{value:.2f}"

def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """
    安全除法，避免除零错误
    
    Args:
        numerator: 分子
        denominator: 分母
        default: 默认值（当分母为0时）
        
    Returns:
        除法结果或默认值
    """
    return numerator / denominator if denominator != 0 else default

def clean_text(text: str) -> str:
    """
    清理文本，移除多余空格和特殊字符
    
    Args:
        text: 原始文本
        
    Returns:
        清理后的文本
    """
    import re
    
    if not text or not isinstance(text, str):
        return ""
    
    # 移除首尾空格
    text = text.strip()
    
    # 标准化换行符为单个换行
    text = re.sub(r'\r\n|\r', '\n', text)
    
    # 移除多余的连续换行符（保留最多2个连续换行）
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # 移除制表符，替换为单个空格
    text = text.replace('\t', ' ')
    
    # 移除多余的连续空格（但保留单个空格用于分词）
    text = re.sub(r' {2,}', ' ', text)
    
    # 移除行首行尾的空格
    lines = text.split('\n')
    lines = [line.strip() for line in lines]
    text = '\n'.join(lines)
    
    # 移除空行（可选，如果需要保持段落结构可以注释掉）
    # text = '\n'.join(line for line in lines if line.strip())
    
    return text

def validate_symbols(symbols: List[str]) -> List[str]:
    """
    验证和标准化股票代码列表
    
    Args:
        symbols: 股票代码列表
        
    Returns:
        验证后的股票代码列表
        
    Raises:
        ValueError: 股票代码无效
    """
    if not symbols:
        raise ValueError("股票代码列表不能为空")
    
    validated_symbols = []
    for symbol in symbols:
        normalized = normalize_symbol(symbol)
        if len(normalized) < 1:
            raise ValueError(f"无效的股票代码: {symbol}")
        validated_symbols.append(normalized)
    
    return validated_symbols

def calculate_correlation_strength(correlation: float) -> str:
    """
    根据相关系数判断相关性强度
    
    Args:
        correlation: 相关系数
        
    Returns:
        相关性强度描述
    """
    abs_corr = abs(correlation)
    
    if abs_corr >= 0.8:
        return "强相关"
    elif abs_corr >= 0.6:
        return "中等相关"
    elif abs_corr >= 0.3:
        return "弱相关"
    else:
        return "无相关"

def generate_date_range(start_date: str, end_date: str, freq: str = 'D') -> List[str]:
    """
    生成日期范围
    
    Args:
        start_date: 开始日期
        end_date: 结束日期
        freq: 频率 ('D'=日, 'W'=周, 'M'=月)
        
    Returns:
        日期字符串列表
    """
    start_dt, end_dt = validate_date_range(start_date, end_date)
    
    date_range = pd.date_range(start=start_dt, end=end_dt, freq=freq)
    return [date.strftime('%Y-%m-%d') for date in date_range]

def calculate_risk_metrics(returns: List[float]) -> Dict[str, float]:
    """
    计算风险指标
    
    Args:
        returns: 收益率序列
        
    Returns:
        风险指标字典
    """
    if not returns:
        return {}
    
    returns_array = np.array(returns)
    
    return {
        'volatility': np.std(returns_array) * np.sqrt(252),  # 年化波动率
        'downside_deviation': np.std(returns_array[returns_array < 0]) * np.sqrt(252),
        'skewness': float(pd.Series(returns).skew()),
        'kurtosis': float(pd.Series(returns).kurtosis()),
        'var_95': np.percentile(returns_array, 5),  # 5% VaR
        'var_99': np.percentile(returns_array, 1),  # 1% VaR
    }
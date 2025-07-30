"""
回测API - 提供投资组合回测服务
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime, date
import logging
import numpy as np
import pandas as pd
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from services.qwen_analyzer import QwenAnalyzer
from config import config
from utils.error_handler import UnifiedResponse, ErrorCode
from utils.helpers import clean_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/backtest", tags=["backtest"])

# 交易条件模型
class TradingCondition(BaseModel):
    type: str = Field(..., description="条件类型: price, technical, fundamental, time")
    operator: str = Field(..., description="操作符: >, <, >=, <=, =, cross_above, cross_below")
    value: float = Field(..., description="条件值")
    indicator: Optional[str] = Field(None, description="技术指标名称")
    period: Optional[int] = Field(None, description="指标周期")
    description: Optional[str] = Field(None, description="条件描述")

# 交易规则模型
class TradingRule(BaseModel):
    buy_conditions: List[TradingCondition] = Field(default=[], description="买入条件")
    buy_amount: float = Field(default=10000, description="买入金额或比例")
    buy_amount_type: str = Field(default="fixed", description="买入类型: fixed, percentage")
    
    sell_conditions: List[TradingCondition] = Field(default=[], description="卖出条件")
    sell_amount: float = Field(default=1.0, description="卖出数量或比例")
    sell_amount_type: str = Field(default="percentage", description="卖出类型: fixed, percentage")
    
    stop_loss: Optional[float] = Field(None, description="止损比例")
    take_profit: Optional[float] = Field(None, description="止盈比例")
    max_position_size: Optional[float] = Field(None, description="最大持仓比例")
    min_holding_period: Optional[int] = Field(None, description="最小持有天数")
    max_holding_period: Optional[int] = Field(None, description="最大持有天数")

# 请求模型
class BacktestRequest(BaseModel):
    strategy_id: str = Field(..., description="策略ID")
    symbols: List[str] = Field(..., description="股票代码列表", min_items=1, max_items=20)
    weights: List[float] = Field(..., description="权重列表", min_items=1, max_items=20)
    start_date: str = Field(..., description="开始日期", pattern=r'^\d{4}-\d{2}-\d{2}$')
    end_date: str = Field(..., description="结束日期", pattern=r'^\d{4}-\d{2}-\d{2}$')
    initial_capital: float = Field(default=1000000, description="初始资金", gt=0)
    commission: float = Field(default=0.001, description="手续费率", ge=0, le=0.1)
    rebalance_frequency: str = Field(default="monthly", description="调仓频率")
    
    # 新增交易规则参数
    trading_rules: Optional[TradingRule] = Field(None, description="交易规则")
    slippage: float = Field(default=0.001, description="滑点")
    min_trade_amount: float = Field(default=1000, description="最小交易金额")

    @validator('weights')
    def validate_weights(cls, v, values):
        if 'symbols' in values and len(v) != len(values['symbols']):
            raise ValueError("权重数量必须与股票数量相等")
        if abs(sum(v) - 1.0) > 0.01:
            raise ValueError("权重总和必须等于1")
        return v

    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values:
            start = datetime.strptime(values['start_date'], "%Y-%m-%d").date()
            end = datetime.strptime(v, "%Y-%m-%d").date()
            if start >= end:
                raise ValueError("结束日期必须晚于开始日期")
            if end > date.today():
                raise ValueError("结束日期不能超过今天")
        return v

def _convert_decimal_to_float(value):
    """将Decimal类型转换为float"""
    if isinstance(value, Decimal):
        return float(value)
    elif value is None:
        return 0.0
    else:
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0

def _safe_float(value, default=0.0):
    """安全地转换为float，避免无穷大值"""
    if value is None:
        return default
    
    try:
        result = float(value)
        # 检查是否为无穷大或NaN
        if not np.isfinite(result):
            if result > 0:
                return 999.99  # 用大数值代替正无穷
            elif result < 0:
                return -999.99  # 用负大数值代替负无穷
            else:
                return default  # NaN的情况
        return result
    except (ValueError, OverflowError, TypeError):
        return default

# 数据库连接
engine = create_engine(config.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

@router.post("/run")
async def run_backtest(request: BacktestRequest):
    """执行回测"""
    try:
        logger.info(f"开始执行回测: {request.strategy_id}")
        
        # 调试：记录输入数据类型
        logger.info(f"请求数据类型检查:")
        logger.info(f"  symbols类型: {type(request.symbols)}, 值: {request.symbols}")
        logger.info(f"  weights类型: {type(request.weights)}, 值: {request.weights}")
        logger.info(f"  symbols长度: {len(request.symbols) if hasattr(request.symbols, '__len__') else 'N/A'}")
        logger.info(f"  weights长度: {len(request.weights) if hasattr(request.weights, '__len__') else 'N/A'}")
        
        # 验证输入参数
        if not request.symbols:
            return JSONResponse(
                status_code=400,
                content=UnifiedResponse.error(
                    ErrorCode.INVALID_BACKTEST_PARAMS,
                    details="股票代码列表不能为空"
                )
            )
        
        # 执行回测计算
        result = await _perform_backtest(request)
        
        # 使用AI生成回测分析和建议
        ai_analysis = await _generate_ai_analysis(result, request)
        result["ai_analysis"] = ai_analysis
        
        return UnifiedResponse.success(result, "回测执行成功")
        
    except ValueError as e:
        logger.error(f"参数验证错误: {e}")
        return JSONResponse(
            status_code=400,
            content=UnifiedResponse.error(ErrorCode.INVALID_BACKTEST_PARAMS, details=str(e))
        )
    except Exception as e:
        logger.error(f"回测执行失败: {e}", exc_info=True)
        error_message = f"回测执行失败: {str(e)}"
        # 如果是数据类型错误，提供更友好的提示
        if "unsupported operand type" in str(e) and "Decimal" in str(e):
            error_message = "数据类型转换错误，正在修复中，请稍后重试"
        
        return JSONResponse(
            status_code=500,
            content=UnifiedResponse.error(ErrorCode.BACKTEST_FAILED, details=error_message)
        )

async def _perform_backtest(request: BacktestRequest) -> Dict[str, Any]:
    """执行回测计算 - 使用真实数据库数据"""
    try:
        # 解析日期
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d").date()
        
        # 从数据库获取股票价格数据
        stock_prices = _get_stock_price_data(request.symbols, start_date, end_date)
        
        # 验证股票数据完整性，缺失的股票直接忽略或使用空数据
        available_symbols = list(stock_prices.keys())
        missing_symbols = [s for s in request.symbols if s not in available_symbols]
        if missing_symbols:
            logger.warning(f"缺少股票数据: {missing_symbols}，这些股票的收益将按0计算")
        
        # 计算回测结果
        result = _calculate_backtest_result(
            stock_prices,
            request.symbols,
            request.weights,
            request.initial_capital,
            request.commission,
            request.rebalance_frequency,
            start_date,
            end_date,
            request.trading_rules,  # 传递交易规则
            request.slippage,
            request.min_trade_amount
        )
        
        logger.info(f"回测完成: {request.strategy_id}, 总收益: {result.get('performance', {}).get('total_return', result.get('total_return', 0)):.2%}")
        return result
        
    except Exception as e:
        logger.error(f"回测计算失败: {e}")
        raise

def _get_stock_price_data(symbols: List[str], start_date: date, end_date: date) -> Dict[str, pd.DataFrame]:
    """从数据库获取股票价格数据"""
    session = SessionLocal()
    try:
        stock_prices = {}
        
        for symbol in symbols:
            # 查询股票价格数据
            query = text("""
                SELECT date, open, high, low, close, volume, changePercent
                FROM stock_data 
                WHERE symbol = :symbol 
                    AND date >= :start_date 
                    AND date <= :end_date 
                    AND close > 0
                ORDER BY date ASC
            """)
            
            result = session.execute(query, {
                'symbol': symbol,
                'start_date': start_date,
                'end_date': end_date
            })
            
            data = result.fetchall()
            
            if data:
                df = pd.DataFrame(data, columns=['date', 'open', 'high', 'low', 'close', 'volume', 'change_percent'])
                df['date'] = pd.to_datetime(df['date'])
                
                # 将Decimal类型转换为float类型，避免类型冲突
                for col in ['open', 'high', 'low', 'close', 'volume', 'change_percent']:
                    if col in df.columns:
                        df[col] = df[col].apply(_convert_decimal_to_float)
                
                df.set_index('date', inplace=True)
                stock_prices[symbol] = df
                logger.info(f"获取股票 {symbol} 数据: {len(df)} 条记录")
            else:
                logger.warning(f"股票 {symbol} 在指定时间段内没有数据")
        
        return stock_prices
        
    finally:
        session.close()

def _calculate_backtest_result(
    stock_prices: Dict[str, pd.DataFrame],
    symbols: List[str],
    weights: List[float],
    initial_capital: float,
    commission: float,
    rebalance_frequency: str,
    start_date: date,
    end_date: date,
    trading_rules: Optional[TradingRule] = None,
    slippage: float = 0.001,
    min_trade_amount: float = 1000
) -> Dict[str, Any]:
    """计算回测结果"""
    
    # 过滤有数据的股票
    available_symbols = [s for s in symbols if s in stock_prices and not stock_prices[s].empty]
    if not available_symbols:
        # 如果没有任何可用数据，返回零收益的回测结果
        logger.warning("没有任何可用的股票数据，返回零收益回测结果")
        return _generate_zero_return_result(initial_capital, start_date, end_date)
    
    # 调整权重（如果某些股票没有数据）
    available_weights = []
    for i, symbol in enumerate(symbols):
        if symbol in available_symbols:
            available_weights.append(weights[i])
    
    # 重新标准化权重
    total_weight = sum(available_weights)
    if total_weight > 0:
        available_weights = [w / total_weight for w in available_weights]
    else:
        available_weights = [1.0 / len(available_symbols)] * len(available_symbols)
    
    # 创建价格矩阵
    all_dates = set()
    for df in stock_prices.values():
        all_dates.update(df.index)
    
    all_dates = sorted(list(all_dates))
    
    # 构建组合价格数据
    price_matrix = pd.DataFrame(index=all_dates)
    for symbol in available_symbols:
        if symbol in stock_prices:
            price_matrix[symbol] = stock_prices[symbol]['close']
    
    # 确保price_matrix中的所有数据都是float类型
    try:
        price_matrix = price_matrix.astype(float)
        logger.info(f"价格矩阵类型转换成功，形状: {price_matrix.shape}")
    except Exception as e:
        logger.error(f"价格矩阵类型转换失败: {e}")
        # 尝试逐列转换
        for col in price_matrix.columns:
            try:
                price_matrix[col] = price_matrix[col].astype(float)
            except Exception as col_error:
                logger.warning(f"列 {col} 转换失败: {col_error}")
                price_matrix[col] = price_matrix[col].apply(_convert_decimal_to_float)
    
    # 前向填充缺失值 - 使用新的语法替代弃用的 method 参数
    price_matrix = price_matrix.ffill().dropna()
    
    if price_matrix.empty:
        raise ValueError("处理后的价格数据为空")
    
    # 计算日收益率
    returns = price_matrix.pct_change().dropna()
    
    # 确保returns中的所有数据都是float类型
    returns = returns.astype(float)
    
    # 计算组合收益率
    portfolio_weights = pd.Series(available_weights, index=available_symbols)
    portfolio_returns = (returns * portfolio_weights).sum(axis=1)
    
    # 计算组合净值
    portfolio_values = []
    current_value = float(initial_capital)  # 确保为float类型
    
    for i, daily_return in enumerate(portfolio_returns):
        # 扣除交易成本（简化处理）
        if i > 0:  # 第一天不扣除成本
            cost = current_value * float(commission) * _get_rebalance_factor(i, rebalance_frequency)
            current_value -= cost
        
        current_value *= (1 + float(daily_return))  # 确保计算都是float类型
        portfolio_values.append(current_value)
    
    # 计算性能指标
    total_return = (current_value - initial_capital) / initial_capital
    
    # 年化收益率
    days = len(portfolio_values)
    if days > 0:
        ratio = current_value / initial_capital
        # 防止极端情况产生无穷大值
        if ratio <= 0:
            annual_return = -0.9999  # 最大亏损99.99%
        else:
            try:
                annual_return = ratio ** (252 / days) - 1
                # 限制年化收益率的最大值，避免无穷大
                if annual_return > 99.99:
                    annual_return = 99.99
                elif annual_return < -0.9999:
                    annual_return = -0.9999
            except (OverflowError, ValueError):
                annual_return = 99.99 if ratio > 1 else -0.9999
    else:
        annual_return = 0
    
    # 最大回撤
    peak = initial_capital
    max_drawdown = 0
    for value in portfolio_values:
        if value > peak:
            peak = value
        drawdown = (peak - value) / peak
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    # 夏普比率
    if len(portfolio_returns) > 1:
        returns_std = portfolio_returns.std() * np.sqrt(252)
        sharpe_ratio = annual_return / returns_std if returns_std > 0 else 0
    else:
        sharpe_ratio = 0
    
    # 胜率
    positive_days = sum(1 for r in portfolio_returns if r > 0)
    win_rate = positive_days / len(portfolio_returns) if len(portfolio_returns) > 0 else 0
    
    # 波动率
    volatility = portfolio_returns.std() * np.sqrt(252)
    
    # 生成资金曲线数据
    equity_curve = []
    for i, value in enumerate(portfolio_values):
        trade_date = returns.index[i]
        equity_curve.append({
            "date": trade_date.strftime("%Y-%m-%d"),
            "value": round(float(value), 2)  # 确保为float类型
        })
    
    # 生成交易记录（基于再平衡或交易规则）
    if trading_rules and (trading_rules.buy_conditions or trading_rules.sell_conditions):
        # 使用交易规则生成交易记录
        trades = _generate_rule_based_trades(
            available_symbols,
            available_weights,
            price_matrix,
            stock_prices,
            initial_capital,
            trading_rules,
            commission,
            slippage,
            min_trade_amount
        )
    else:
        # 使用传统的再平衡方式
        trades = _generate_trade_records(
            available_symbols,
            available_weights,
            price_matrix,
            initial_capital,
            rebalance_frequency
        )
    
    # 计算个股表现
    individual_results = []
    for i, symbol in enumerate(available_symbols):
        if symbol in stock_prices:
            symbol_df = stock_prices[symbol]
            if not symbol_df.empty:
                symbol_return = (symbol_df['close'].iloc[-1] / symbol_df['close'].iloc[0]) - 1
                symbol_volatility = symbol_df['close'].pct_change().std() * np.sqrt(252)
                
                individual_results.append({
                    "symbol": symbol,
                    "weight": available_weights[i],
                    "return": _safe_float(symbol_return),  # 安全转换为float
                    "volatility": _safe_float(symbol_volatility)  # 安全转换为float
                })
    
    # 构建结果 - 添加 performance 字段以兼容前端
    result = {
        "strategy_id": symbols[0] if symbols else "unknown",
        "total_return": _safe_float(total_return),
        "annual_return": _safe_float(annual_return),
        "annualized_return": _safe_float(annual_return),  # 兼容字段
        "max_drawdown": _safe_float(max_drawdown),
        "sharpe_ratio": _safe_float(sharpe_ratio),
        "win_rate": _safe_float(win_rate),
        "profit_factor": _safe_float(_calculate_profit_factor(portfolio_returns)),
        "volatility": _safe_float(volatility),
        "trades": trades,
        "equity_curve": equity_curve,
        "portfolio_composition": [
            {"symbol": symbol, "weight": weight, "name": _get_stock_name(symbol)}
            for symbol, weight in zip(available_symbols, available_weights)
        ],
        "individual_results": individual_results,
        "data_summary": {
            "requested_symbols": len(symbols),
            "available_symbols": len(available_symbols),
            "trading_days": len(portfolio_values),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        },
        # 添加 performance 字段以兼容前端期望的结构
        "performance": {
            "total_return": _safe_float(total_return),
            "annual_return": _safe_float(annual_return),
            "annualized_return": _safe_float(annual_return),
            "max_drawdown": _safe_float(max_drawdown),
            "sharpe_ratio": _safe_float(sharpe_ratio),
            "win_rate": _safe_float(win_rate),
            "profit_factor": _safe_float(_calculate_profit_factor(portfolio_returns)),
            "volatility": _safe_float(volatility)
        }
    }
    
    return result

def _get_rebalance_factor(day_index: int, rebalance_frequency: str) -> float:
    """获取再平衡因子"""
    if rebalance_frequency == "daily":
        return 1.0
    elif rebalance_frequency == "weekly":
        return 1.0 if day_index % 5 == 0 else 0.0
    elif rebalance_frequency == "monthly":
        return 1.0 if day_index % 22 == 0 else 0.0
    elif rebalance_frequency == "quarterly":
        return 1.0 if day_index % 66 == 0 else 0.0
    else:
        return 0.0

def _calculate_profit_factor(returns: pd.Series) -> float:
    """计算盈亏比"""
    positive_returns = returns[returns > 0].sum()
    negative_returns = abs(returns[returns < 0].sum())
    
    if negative_returns == 0:
        # 避免返回inf，使用一个大数值代替
        return 999.99 if positive_returns > 0 else 0
    
    return positive_returns / negative_returns

def _generate_trade_records(
    symbols: List[str],
    weights: List[float],
    price_matrix: pd.DataFrame,
    initial_capital: float,
    rebalance_frequency: str
) -> List[Dict[str, Any]]:
    """生成交易记录（基于再平衡）"""
    trades = []
    
    # 计算再平衡日期
    rebalance_days = []
    if rebalance_frequency == "monthly":
        # 每月第一个交易日
        for i in range(0, len(price_matrix), 22):
            if i < len(price_matrix):
                rebalance_days.append(i)
    elif rebalance_frequency == "quarterly":
        # 每季度第一个交易日
        for i in range(0, len(price_matrix), 66):
            if i < len(price_matrix):
                rebalance_days.append(i)
    else:
        # 默认只在第一天买入
        rebalance_days = [0]
    
    # 生成交易记录
    for day_idx in rebalance_days:
        if day_idx >= len(price_matrix):
            continue
            
        trade_date = price_matrix.index[day_idx]
        
        for i, symbol in enumerate(symbols):
            if symbol in price_matrix.columns:
                price = price_matrix.loc[trade_date, symbol]
                if pd.notna(price) and price > 0:
                    target_value = float(initial_capital) * float(weights[i])
                    quantity = int(target_value / float(price) / 100) * 100  # 按手交易
                    
                    if quantity > 0:
                        trades.append({
                            "id": f"trade_{len(trades)+1}",
                            "symbol": symbol,
                            "side": "buy",
                            "price": round(float(price), 2),
                            "quantity": quantity,
                            "timestamp": trade_date.strftime("%Y-%m-%d"),
                            "pnl": 0  # 买入时PnL为0
                        })
    
    return trades

def _generate_rule_based_trades(
    symbols: List[str],
    weights: List[float],
    price_matrix: pd.DataFrame,
    stock_prices: Dict[str, pd.DataFrame],
    initial_capital: float,
    trading_rules: TradingRule,
    commission: float,
    slippage: float,
    min_trade_amount: float
) -> List[Dict[str, Any]]:
    """基于交易规则生成交易记录"""
    trades = []
    positions = {}  # 持仓记录 {symbol: {'quantity': int, 'avg_price': float, 'buy_date': date}}
    current_cash = float(initial_capital)
    
    logger.info(f"开始基于交易规则生成交易记录，初始资金: {initial_capital}")
    
    # 遍历每个交易日
    for date_idx, trade_date in enumerate(price_matrix.index):
        daily_prices = price_matrix.loc[trade_date]
        
        # 检查每只股票的买卖条件
        for symbol in symbols:
            if symbol not in daily_prices or pd.isna(daily_prices[symbol]):
                continue
                
            current_price = float(daily_prices[symbol])
            stock_data = stock_prices.get(symbol)
            
            if stock_data is None or stock_data.empty:
                continue
            
            # 获取当前日期之前的历史数据用于技术指标计算
            historical_data = stock_data.loc[:trade_date]
            
            # 检查买入条件
            if symbol not in positions and _check_buy_conditions(
                trading_rules.buy_conditions, 
                current_price, 
                historical_data, 
                date_idx
            ):
                # 计算买入数量
                buy_amount = _calculate_buy_amount(
                    trading_rules.buy_amount,
                    trading_rules.buy_amount_type,
                    current_cash,
                    current_price,
                    trading_rules.max_position_size,
                    initial_capital,
                    min_trade_amount
                )
                
                if buy_amount > 0 and current_cash >= buy_amount * current_price:
                    # 考虑滑点
                    actual_price = current_price * (1 + slippage)
                    quantity = int(buy_amount)
                    total_cost = quantity * actual_price * (1 + commission)
                    
                    if total_cost <= current_cash and total_cost >= min_trade_amount:
                        # 执行买入
                        positions[symbol] = {
                            'quantity': quantity,
                            'avg_price': actual_price,
                            'buy_date': trade_date
                        }
                        current_cash -= total_cost
                        
                        trades.append({
                            "id": f"trade_{len(trades)+1}",
                            "symbol": symbol,
                            "side": "buy",
                            "price": round(actual_price, 2),
                            "quantity": quantity,
                            "timestamp": trade_date.strftime("%Y-%m-%d"),
                            "pnl": 0,
                            "reason": "买入条件触发"
                        })
                        
                        logger.info(f"买入 {symbol}: {quantity}股 @ {actual_price:.2f}元")
            
            # 检查卖出条件
            elif symbol in positions and _check_sell_conditions(
                trading_rules.sell_conditions,
                current_price,
                historical_data,
                date_idx,
                positions[symbol],
                trading_rules.stop_loss,
                trading_rules.take_profit,
                trading_rules.min_holding_period,
                trading_rules.max_holding_period
            ):
                # 计算卖出数量
                position = positions[symbol]
                sell_quantity = _calculate_sell_amount(
                    trading_rules.sell_amount,
                    trading_rules.sell_amount_type,
                    position['quantity']
                )
                
                if sell_quantity > 0:
                    # 考虑滑点
                    actual_price = current_price * (1 - slippage)
                    total_proceeds = sell_quantity * actual_price * (1 - commission)
                    
                    # 计算盈亏
                    cost_basis = sell_quantity * position['avg_price']
                    pnl = total_proceeds - cost_basis
                    
                    # 执行卖出
                    current_cash += total_proceeds
                    
                    trades.append({
                        "id": f"trade_{len(trades)+1}",
                        "symbol": symbol,
                        "side": "sell",
                        "price": round(actual_price, 2),
                        "quantity": sell_quantity,
                        "timestamp": trade_date.strftime("%Y-%m-%d"),
                        "pnl": round(pnl, 2),
                        "reason": "卖出条件触发"
                    })
                    
                    logger.info(f"卖出 {symbol}: {sell_quantity}股 @ {actual_price:.2f}元, 盈亏: {pnl:.2f}元")
                    
                    # 更新持仓
                    if sell_quantity >= position['quantity']:
                        del positions[symbol]  # 全部卖出
                    else:
                        positions[symbol]['quantity'] -= sell_quantity  # 部分卖出
    
    logger.info(f"交易规则执行完成，共生成 {len(trades)} 笔交易")
    return trades

def _check_buy_conditions(
    conditions: List[TradingCondition],
    current_price: float,
    historical_data: pd.DataFrame,
    date_idx: int
) -> bool:
    """检查买入条件是否满足"""
    if not conditions:
        return False
    
    for condition in conditions:
        if not _evaluate_condition(condition, current_price, historical_data, date_idx):
            return False  # 所有条件都必须满足（AND逻辑）
    
    return True

def _check_sell_conditions(
    conditions: List[TradingCondition],
    current_price: float,
    historical_data: pd.DataFrame,
    date_idx: int,
    position: Dict[str, Any],
    stop_loss: Optional[float],
    take_profit: Optional[float],
    min_holding_period: Optional[int],
    max_holding_period: Optional[int]
) -> bool:
    """检查卖出条件是否满足"""
    
    # 检查最小持有期限
    if min_holding_period and date_idx < min_holding_period:
        return False
    
    # 检查最大持有期限
    if max_holding_period and date_idx >= max_holding_period:
        return True
    
    # 检查止损
    if stop_loss:
        price_change = (current_price - position['avg_price']) / position['avg_price']
        if price_change <= stop_loss:
            return True
    
    # 检查止盈
    if take_profit:
        price_change = (current_price - position['avg_price']) / position['avg_price']
        if price_change >= take_profit:
            return True
    
    # 检查自定义卖出条件
    if conditions:
        for condition in conditions:
            if _evaluate_condition(condition, current_price, historical_data, date_idx):
                return True  # 任一条件满足即可卖出（OR逻辑）
    
    return False

def _evaluate_condition(
    condition: TradingCondition,
    current_price: float,
    historical_data: pd.DataFrame,
    date_idx: int
) -> bool:
    """评估单个交易条件"""
    try:
        if condition.type == "price":
            # 价格条件
            target_value = float(condition.value)
            return _compare_values(current_price, condition.operator, target_value)
        
        elif condition.type == "technical":
            # 技术指标条件
            if condition.indicator and len(historical_data) > 0:
                indicator_value = _calculate_technical_indicator(
                    condition.indicator,
                    historical_data,
                    condition.period or 20
                )
                if indicator_value is not None:
                    target_value = float(condition.value)
                    return _compare_values(indicator_value, condition.operator, target_value)
        
        elif condition.type == "time":
            # 时间条件（如持有天数）
            return date_idx >= int(condition.value)
        
        elif condition.type == "fundamental":
            # 基本面条件（暂时简化处理）
            return True
        
        return False
        
    except Exception as e:
        logger.warning(f"条件评估失败: {condition}, 错误: {e}")
        return False

def _compare_values(value1: float, operator: str, value2: float) -> bool:
    """比较两个数值"""
    if operator == ">":
        return value1 > value2
    elif operator == "<":
        return value1 < value2
    elif operator == ">=":
        return value1 >= value2
    elif operator == "<=":
        return value1 <= value2
    elif operator == "=":
        return abs(value1 - value2) < 0.01  # 允许小误差
    else:
        return False

def _calculate_technical_indicator(
    indicator: str,
    data: pd.DataFrame,
    period: int
) -> Optional[float]:
    """计算技术指标"""
    try:
        if len(data) < period:
            return None
        
        if indicator.upper() == "MA":
            # 移动平均线
            return data['close'].tail(period).mean()
        
        elif indicator.upper() == "RSI":
            # RSI指标
            closes = data['close'].tail(period + 1)
            if len(closes) < 2:
                return None
            
            deltas = closes.diff()
            gains = deltas.where(deltas > 0, 0)
            losses = -deltas.where(deltas < 0, 0)
            
            avg_gain = gains.mean()
            avg_loss = losses.mean()
            
            if avg_loss == 0:
                return 100
            
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            return rsi
        
        elif indicator.upper() == "MACD":
            # MACD指标（简化版）
            closes = data['close']
            if len(closes) < 26:
                return None
            
            ema12 = closes.ewm(span=12).mean().iloc[-1]
            ema26 = closes.ewm(span=26).mean().iloc[-1]
            macd = ema12 - ema26
            return macd
        
        else:
            logger.warning(f"不支持的技术指标: {indicator}")
            return None
            
    except Exception as e:
        logger.error(f"技术指标计算失败: {indicator}, 错误: {e}")
        return None

def _calculate_buy_amount(
    amount: float,
    amount_type: str,
    current_cash: float,
    current_price: float,
    max_position_size: Optional[float],
    initial_capital: float,
    min_trade_amount: float
) -> int:
    """计算买入数量"""
    try:
        if amount_type == "percentage":
            # 按比例买入
            target_value = current_cash * amount
        else:
            # 固定金额买入
            target_value = amount
        
        # 检查最大持仓限制
        if max_position_size:
            max_value = initial_capital * max_position_size
            target_value = min(target_value, max_value)
        
        # 检查最小交易金额
        if target_value < min_trade_amount:
            return 0
        
        # 计算股数（按手交易，1手=100股）
        quantity = int(target_value / current_price / 100) * 100
        return max(0, quantity)
        
    except Exception as e:
        logger.error(f"买入数量计算失败: {e}")
        return 0

def _calculate_sell_amount(
    amount: float,
    amount_type: str,
    current_quantity: int
) -> int:
    """计算卖出数量"""
    try:
        if amount_type == "percentage":
            # 按比例卖出
            sell_quantity = int(current_quantity * amount)
        else:
            # 固定数量卖出
            sell_quantity = int(amount)
        
        return min(sell_quantity, current_quantity)
        
    except Exception as e:
        logger.error(f"卖出数量计算失败: {e}")
        return 0

def _get_stock_name(symbol: str) -> str:
    """获取股票名称"""
    session = SessionLocal()
    try:
        query = text("SELECT name FROM stock_info WHERE symbol = :symbol")
        result = session.execute(query, {'symbol': symbol})
        row = result.fetchone()
        return row[0] if row else symbol
    except:
        return symbol
    finally:
        session.close()

async def _generate_ai_analysis(result: Dict[str, Any], request: BacktestRequest) -> Dict[str, Any]:
    """使用通义千问生成回测分析和建议"""
    try:
        qwen = QwenAnalyzer()
        
        # 确保symbols和weights是列表类型，防止协程对象错误
        symbols = request.symbols if isinstance(request.symbols, list) else []
        weights = request.weights if isinstance(request.weights, list) else []
        
        # 验证数据长度匹配
        if len(symbols) != len(weights):
            logger.warning(f"符号数量({len(symbols)})与权重数量({len(weights)})不匹配")
            # 使用较短的长度
            min_len = min(len(symbols), len(weights))
            symbols = symbols[:min_len]
            weights = weights[:min_len]
        
        # 构建分析提示词
        if symbols and weights:
            portfolio_info = ", ".join([f"{symbol}({weight:.1%})" for symbol, weight in zip(symbols, weights)])
        else:
            portfolio_info = "无法获取组合信息"
        
        analysis_prompt = f"""
        请分析以下股票组合回测结果，并提供专业的投资建议：

        **组合信息：**
        - 股票组合：{portfolio_info}
        - 回测期间：{request.start_date} 至 {request.end_date}
        - 初始资金：{request.initial_capital:,.0f}元
        - 再平衡频率：{request.rebalance_frequency}

        **回测结果：**
        - 总收益率：{result['total_return']:.2%}
        - 年化收益率：{result['annual_return']:.2%}
        - 最大回撤：{result['max_drawdown']:.2%}
        - 夏普比率：{result['sharpe_ratio']:.2f}
        - 胜率：{result['win_rate']:.1%}
        - 波动率：{result['volatility']:.2%}

        请从以下几个方面进行分析：
        1. **收益表现评价**：评价总体收益水平和风险调整后收益
        2. **风险控制分析**：分析最大回撤和波动率水平
        3. **组合配置评估**：评价股票选择和权重配置的合理性
        4. **改进建议**：提供具体的优化建议
        5. **投资建议**：给出是否值得投资的建议

        请用专业但易懂的语言回答，每个方面2-3句话即可。
        """
        
        ai_response = qwen.analyze_text(analysis_prompt, max_tokens=3000)
        
        # 生成投资评级
        rating = _generate_investment_rating(result)
        
        # 生成风险提示
        risk_warnings = _generate_risk_warnings(result, request)
        
        # 生成优化建议
        optimization_suggestions = await _generate_optimization_suggestions(result, request, qwen)
        
        return {
            "analysis_text": clean_text(ai_response),
            "investment_rating": rating,
            "risk_warnings": risk_warnings,
            "optimization_suggestions": optimization_suggestions,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI分析生成失败: {e}", exc_info=True)
        return {
            "analysis_text": "AI分析暂时不可用，请稍后重试。",
            "investment_rating": "中性",
            "risk_warnings": ["请注意投资风险，过往业绩不代表未来表现。"],
            "optimization_suggestions": ["建议进一步分析市场环境和个股基本面。"],
            "generated_at": datetime.now().isoformat()
        }

def _generate_investment_rating(result: Dict[str, Any]) -> str:
    """根据回测结果生成投资评级"""
    annual_return = result.get('annual_return', 0)
    max_drawdown = result.get('max_drawdown', 0)
    sharpe_ratio = result.get('sharpe_ratio', 0)
    
    # 综合评分
    score = 0
    
    # 收益率评分
    if annual_return > 0.15:
        score += 3
    elif annual_return > 0.08:
        score += 2
    elif annual_return > 0:
        score += 1
    
    # 回撤评分
    if max_drawdown < 0.1:
        score += 2
    elif max_drawdown < 0.2:
        score += 1
    
    # 夏普比率评分
    if sharpe_ratio > 1.5:
        score += 2
    elif sharpe_ratio > 1.0:
        score += 1
    
    # 根据总分确定评级
    if score >= 6:
        return "优秀"
    elif score >= 4:
        return "良好"
    elif score >= 2:
        return "中性"
    else:
        return "较差"

def _generate_risk_warnings(result: Dict[str, Any], request: BacktestRequest) -> List[str]:
    """生成风险提示"""
    warnings = []
    
    max_drawdown = result.get('max_drawdown', 0)
    volatility = result.get('volatility', 0)
    sharpe_ratio = result.get('sharpe_ratio', 0)
    
    if max_drawdown > 0.3:
        warnings.append("组合最大回撤较大，存在较高的资金损失风险")
    elif max_drawdown > 0.2:
        warnings.append("组合存在一定的回撤风险，需要做好心理准备")
    
    if volatility > 0.3:
        warnings.append("组合波动率较高，价格波动可能较为剧烈")
    
    if sharpe_ratio < 0.5:
        warnings.append("风险调整后收益较低，可能不如无风险投资")
    
    if len(request.symbols) < 5:
        warnings.append("组合股票数量较少，分散化程度有限")
    
    # 通用风险提示
    warnings.append("回测结果基于历史数据，不代表未来表现")
    warnings.append("实际投资中可能面临交易成本、流动性等额外风险")
    
    return warnings

async def _generate_optimization_suggestions(result: Dict[str, Any], request: BacktestRequest, qwen: QwenAnalyzer) -> List[str]:
    """生成优化建议"""
    try:
        suggestions_prompt = f"""
        基于以下回测结果，请提供3-5个具体的组合优化建议：

        组合：{', '.join(request.symbols)}
        年化收益：{result['annual_return']:.2%}
        最大回撤：{result['max_drawdown']:.2%}
        夏普比率：{result['sharpe_ratio']:.2f}
        股票数量：{len(request.symbols)}个

        请从以下角度提供建议：
        - 股票选择优化
        - 权重配置调整
        - 风险控制改进
        - 再平衡策略
        - 行业分散化

        每个建议用一句话表达，要具体可操作。
        """
        
        suggestions_text = qwen.analyze_text(suggestions_prompt, max_tokens=1500)
        
        # 解析建议文本为列表
        suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip() and not s.strip().startswith('#')]
        
        return suggestions[:5] if suggestions else [
            "考虑增加股票数量以提高分散化程度",
            "定期评估和调整股票权重配置",
            "关注宏观经济环境变化对组合的影响"
        ]
        
    except Exception as e:
        logger.error(f"优化建议生成失败: {e}")
        return [
            "建议定期回顾和调整投资组合",
            "考虑增加不同行业的股票以分散风险",
            "关注市场环境变化，适时调整策略"
        ]

def _generate_zero_return_result(initial_capital: float, start_date: date, end_date: date) -> Dict[str, Any]:
    """生成零收益的回测结果"""
    
    # 计算交易日数量（简单估算，一年约250个交易日）
    total_days = (end_date - start_date).days
    trading_days = max(1, int(total_days * 250 / 365))
    
    # 生成日期序列
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    trading_dates = [d for d in date_range if d.weekday() < 5]  # 只包含工作日
    
    # 生成零收益的资金曲线
    equity_curve = []
    for i, date in enumerate(trading_dates[:min(len(trading_dates), trading_days)]):
        equity_curve.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": float(initial_capital),  # 始终保持初始资金
            "daily_return": 0.0,
            "cumulative_return": 0.0
        })
    
    # 如果没有交易日，至少添加一个数据点
    if not equity_curve:
        equity_curve.append({
            "date": start_date.strftime("%Y-%m-%d"),
            "value": float(initial_capital),
            "daily_return": 0.0,
            "cumulative_return": 0.0
        })
    
    return {
        "strategy_id": "zero_return",
        "total_return": 0.0,
        "annual_return": 0.0,
        "annualized_return": 0.0,  # 兼容字段
        "max_drawdown": 0.0,
        "sharpe_ratio": 0.0,
        "win_rate": 0.0,
        "profit_factor": 0.0,
        "volatility": 0.0,
        "trades": [],  # 没有交易记录
        "equity_curve": equity_curve,
        "portfolio_composition": [],  # 没有组合构成
        "individual_results": [],
        "data_summary": {
            "requested_symbols": 0,
            "available_symbols": 0,
            "trading_days": len(equity_curve),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        },
        # 添加 performance 字段以兼容前端期望的结构
        "performance": {
            "total_return": 0.0,
            "annual_return": 0.0,
            "annualized_return": 0.0,
            "max_drawdown": 0.0,
            "sharpe_ratio": 0.0,
            "win_rate": 0.0,
            "profit_factor": 0.0,
            "volatility": 0.0
        }
    }
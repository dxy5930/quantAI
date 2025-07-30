"""
股票相关数据模型
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Index
from sqlalchemy.sql import func
from .database import Base
import datetime

class Stock(Base):
    """股票基础信息表 - 对应stock_info表"""
    __tablename__ = "stock_info"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False, comment="股票代码")
    name = Column(String(100), nullable=False, comment="股票名称")
    industry = Column(String(50), comment="所属行业")
    sector = Column(String(50), comment="所属板块")
    market = Column(String(20), comment="上市地点")
    listDate = Column(DateTime, comment="上市日期")
    marketCap = Column(Float, comment="总市值")
    circulationMarketCap = Column(Float, comment="流通市值")
    totalShares = Column(Integer, comment="总股本")
    circulationShares = Column(Integer, comment="流通股本")
    peRatio = Column(Float, comment="市盈率(TTM)")
    pbRatio = Column(Float, comment="市净率")
    dividendYield = Column(Float, comment="股息率(%)")
    isActive = Column(Boolean, default=True, comment="是否活跃")
    createdAt = Column(DateTime, default=func.now(), comment="创建时间")
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 创建索引
    __table_args__ = (
        Index('idx_symbol', 'symbol'),
    )

class StockPrice(Base):
    """股票价格数据表"""
    __tablename__ = "stock_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True, nullable=False, comment="股票代码")
    date = Column(DateTime, index=True, nullable=False, comment="交易日期")
    open_price = Column(Float, comment="开盘价")
    high_price = Column(Float, comment="最高价")
    low_price = Column(Float, comment="最低价")
    close_price = Column(Float, comment="收盘价")
    volume = Column(Integer, comment="成交量")
    turnover = Column(Float, comment="成交额")
    change_percent = Column(Float, comment="涨跌幅")
    created_at = Column(DateTime, default=func.now())
    
    # 创建复合索引
    __table_args__ = (
        Index('idx_symbol_date', 'symbol', 'date'),
        Index('idx_date_symbol', 'date', 'symbol'),
    )

class StockFinancial(Base):
    """股票财务数据表"""
    __tablename__ = "stock_financials"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True, nullable=False, comment="股票代码")
    report_date = Column(DateTime, index=True, nullable=False, comment="报告期")
    report_type = Column(String(20), comment="报告类型")
    
    # 估值指标
    pe_ratio = Column(Float, index=True, comment="市盈率")
    pb_ratio = Column(Float, index=True, comment="市净率")
    ps_ratio = Column(Float, comment="市销率")
    peg_ratio = Column(Float, comment="PEG比率")
    
    # 盈利能力
    roe = Column(Float, index=True, comment="净资产收益率")
    roa = Column(Float, comment="总资产收益率")
    gross_margin = Column(Float, comment="毛利率")
    net_margin = Column(Float, comment="净利率")
    
    # 财务健康
    debt_ratio = Column(Float, index=True, comment="资产负债率")
    current_ratio = Column(Float, comment="流动比率")
    quick_ratio = Column(Float, comment="速动比率")
    
    # 成长性
    revenue_growth = Column(Float, comment="营收增长率")
    profit_growth = Column(Float, comment="利润增长率")
    
    # 基础财务数据
    total_revenue = Column(Float, comment="总营收")
    net_profit = Column(Float, comment="净利润")
    total_assets = Column(Float, comment="总资产")
    total_equity = Column(Float, comment="股东权益")
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 创建复合索引
    __table_args__ = (
        Index('idx_symbol_report_date', 'symbol', 'report_date'),
        Index('idx_pe_ratio', 'pe_ratio'),
        Index('idx_roe_debt', 'roe', 'debt_ratio'),
    )

class StockTechnical(Base):
    """股票技术指标表"""
    __tablename__ = "stock_technicals"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True, nullable=False, comment="股票代码")
    date = Column(DateTime, index=True, nullable=False, comment="计算日期")
    
    # 移动平均线
    ma5 = Column(Float, comment="5日均线")
    ma10 = Column(Float, comment="10日均线")
    ma20 = Column(Float, comment="20日均线")
    ma50 = Column(Float, comment="50日均线")
    ma200 = Column(Float, comment="200日均线")
    
    # 技术指标
    rsi = Column(Float, index=True, comment="RSI指标")
    macd = Column(Float, comment="MACD")
    macd_signal = Column(Float, comment="MACD信号线")
    macd_histogram = Column(Float, comment="MACD柱状图")
    
    # 布林带
    bb_upper = Column(Float, comment="布林带上轨")
    bb_middle = Column(Float, comment="布林带中轨")
    bb_lower = Column(Float, comment="布林带下轨")
    
    # 成交量指标
    volume_ma = Column(Float, comment="成交量均线")
    volume_ratio = Column(Float, comment="量比")
    
    # 趋势信号
    trend_signal = Column(String(20), index=True, comment="趋势信号")
    macd_signal_type = Column(String(20), index=True, comment="MACD信号类型")
    
    created_at = Column(DateTime, default=func.now())
    
    # 创建复合索引
    __table_args__ = (
        Index('idx_symbol_date_tech', 'symbol', 'date'),
        Index('idx_rsi_macd', 'rsi', 'macd_signal_type'),
        Index('idx_trend_signal', 'trend_signal'),
    )

class StockConcept(Base):
    """股票概念标签表"""
    __tablename__ = "stock_concepts"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True, nullable=False, comment="股票代码")
    concept = Column(String(100), index=True, nullable=False, comment="概念名称")
    concept_type = Column(String(50), index=True, comment="概念类型")
    weight = Column(Float, default=1.0, comment="权重")
    is_active = Column(Boolean, default=True, comment="是否活跃")
    created_at = Column(DateTime, default=func.now())
    
    # 创建复合索引
    __table_args__ = (
        Index('idx_symbol_concept', 'symbol', 'concept'),
        Index('idx_concept_type', 'concept', 'concept_type'),
    )
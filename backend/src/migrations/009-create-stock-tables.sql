-- 创建股票相关数据表
-- 009-create-stock-tables.sql

-- 1. 股票基础信息表
CREATE TABLE stocks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    symbol VARCHAR(20) NOT NULL UNIQUE COMMENT '股票代码',
    name VARCHAR(100) NOT NULL COMMENT '股票名称',
    sector VARCHAR(50) COMMENT '所属行业',
    industry VARCHAR(100) COMMENT '所属子行业',
    market_cap BIGINT COMMENT '市值',
    exchange VARCHAR(20) COMMENT '交易所',
    currency VARCHAR(10) DEFAULT 'USD' COMMENT '货币单位',
    country VARCHAR(50) COMMENT '所属国家',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否活跃交易',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_symbol (symbol),
    INDEX idx_sector (sector),
    INDEX idx_market_cap (market_cap)
) COMMENT '股票基础信息表';

-- 2. 股票推荐表
CREATE TABLE stock_recommendations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    stock_id VARCHAR(36) NOT NULL COMMENT '股票ID',
    symbol VARCHAR(20) NOT NULL COMMENT '股票代码',
    score DECIMAL(5,2) NOT NULL COMMENT '推荐评分',
    reason TEXT COMMENT '推荐理由',
    target_price DECIMAL(10,2) COMMENT '目标价格',
    risk_level ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT '风险等级',
    recommendation_type ENUM('BUY', 'HOLD', 'SELL') DEFAULT 'HOLD' COMMENT '推荐类型',
    confidence DECIMAL(3,2) COMMENT '置信度',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_stock_id (stock_id),
    INDEX idx_score (score DESC)
) COMMENT '股票推荐表';

-- 3. 回测股票表
CREATE TABLE backtest_stocks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    stock_id VARCHAR(36) NOT NULL COMMENT '股票ID',
    symbol VARCHAR(20) NOT NULL COMMENT '股票代码',
    weight DECIMAL(5,4) NOT NULL COMMENT '权重',
    performance DECIMAL(8,4) COMMENT '表现(%)',
    contribution DECIMAL(8,4) COMMENT '贡献度',
    trades_count INT DEFAULT 0 COMMENT '交易次数',
    avg_price DECIMAL(10,2) COMMENT '平均成交价',
    total_return DECIMAL(8,4) COMMENT '总收益率',
    max_drawdown DECIMAL(8,4) COMMENT '最大回撤',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_stock_id (stock_id),
    INDEX idx_weight (weight DESC)
) COMMENT '回测股票表';

-- 4. 股票价格历史表
CREATE TABLE stock_price_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    stock_id VARCHAR(36) NOT NULL COMMENT '股票ID',
    symbol VARCHAR(20) NOT NULL COMMENT '股票代码',
    date DATE NOT NULL COMMENT '日期',
    open_price DECIMAL(10,4) COMMENT '开盘价',
    high_price DECIMAL(10,4) COMMENT '最高价',
    low_price DECIMAL(10,4) COMMENT '最低价',
    close_price DECIMAL(10,4) NOT NULL COMMENT '收盘价',
    volume BIGINT COMMENT '成交量',
    adj_close DECIMAL(10,4) COMMENT '调整后收盘价',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    UNIQUE KEY uk_stock_date (stock_id, date),
    INDEX idx_symbol_date (symbol, date),
    INDEX idx_date (date)
) COMMENT '股票价格历史表';

-- 5. 技术分析数据表
CREATE TABLE technical_analysis (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    stock_id VARCHAR(36) NOT NULL COMMENT '股票ID',
    symbol VARCHAR(20) NOT NULL COMMENT '股票代码',
    date DATE NOT NULL COMMENT '分析日期',
    rsi DECIMAL(5,2) COMMENT 'RSI指标',
    macd DECIMAL(8,4) COMMENT 'MACD值',
    macd_signal DECIMAL(8,4) COMMENT 'MACD信号线',
    macd_histogram DECIMAL(8,4) COMMENT 'MACD柱状图',
    ma5 DECIMAL(10,4) COMMENT '5日均线',
    ma10 DECIMAL(10,4) COMMENT '10日均线',
    ma20 DECIMAL(10,4) COMMENT '20日均线',
    ma50 DECIMAL(10,4) COMMENT '50日均线',
    ma200 DECIMAL(10,4) COMMENT '200日均线',
    support_level DECIMAL(10,4) COMMENT '支撑位',
    resistance_level DECIMAL(10,4) COMMENT '阻力位',
    trend ENUM('bullish', 'bearish', 'neutral') COMMENT '趋势方向',
    strength ENUM('strong', 'moderate', 'weak') COMMENT '趋势强度',
    bollinger_upper DECIMAL(10,4) COMMENT '布林带上轨',
    bollinger_middle DECIMAL(10,4) COMMENT '布林带中轨',
    bollinger_lower DECIMAL(10,4) COMMENT '布林带下轨',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    UNIQUE KEY uk_stock_date (stock_id, date),
    INDEX idx_symbol_date (symbol, date),
    INDEX idx_rsi (rsi),
    INDEX idx_trend (trend)
) COMMENT '技术分析数据表';

-- 6. 基本面分析数据表
CREATE TABLE fundamental_analysis (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    stock_id VARCHAR(36) NOT NULL COMMENT '股票ID',
    symbol VARCHAR(20) NOT NULL COMMENT '股票代码',
    report_date DATE NOT NULL COMMENT '报告日期',
    pe_ratio DECIMAL(8,2) COMMENT '市盈率',
    pb_ratio DECIMAL(8,2) COMMENT '市净率',
    ps_ratio DECIMAL(8,2) COMMENT '市销率',
    roe DECIMAL(8,4) COMMENT '净资产收益率',
    roa DECIMAL(8,4) COMMENT '总资产收益率',
    debt_to_equity DECIMAL(8,4) COMMENT '负债权益比',
    current_ratio DECIMAL(8,4) COMMENT '流动比率',
    quick_ratio DECIMAL(8,4) COMMENT '速动比率',
    gross_margin DECIMAL(8,4) COMMENT '毛利率',
    operating_margin DECIMAL(8,4) COMMENT '营业利润率',
    net_margin DECIMAL(8,4) COMMENT '净利润率',
    revenue BIGINT COMMENT '营业收入',
    net_income BIGINT COMMENT '净利润',
    total_assets BIGINT COMMENT '总资产',
    total_equity BIGINT COMMENT '股东权益',
    free_cash_flow BIGINT COMMENT '自由现金流',
    dividend_yield DECIMAL(6,4) COMMENT '股息率',
    payout_ratio DECIMAL(6,4) COMMENT '派息比率',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    UNIQUE KEY uk_stock_report_date (stock_id, report_date),
    INDEX idx_symbol_date (symbol, report_date),
    INDEX idx_pe_ratio (pe_ratio),
    INDEX idx_pb_ratio (pb_ratio),
    INDEX idx_roe (roe DESC)
) COMMENT '基本面分析数据表';

-- 7. 策略图表数据表
CREATE TABLE strategy_chart_data (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    chart_type ENUM('equity', 'drawdown', 'returns', 'performance', 'stock_performance', 'sector_analysis', 'risk_metrics', 'selection_history') NOT NULL COMMENT '图表类型',
    period VARCHAR(10) NOT NULL COMMENT '时间周期',
    data_date DATE NOT NULL COMMENT '数据日期',
    data_value JSON NOT NULL COMMENT '图表数据值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
    INDEX idx_strategy_chart (strategy_id, chart_type),
    INDEX idx_strategy_period (strategy_id, period),
    INDEX idx_data_date (data_date)
) COMMENT '策略图表数据表';

-- 8. 行业分析数据表
CREATE TABLE sector_analysis (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    strategy_id VARCHAR(36) NOT NULL COMMENT '策略ID',
    sector VARCHAR(50) NOT NULL COMMENT '行业名称',
    stock_count INT DEFAULT 0 COMMENT '股票数量',
    avg_score DECIMAL(5,2) COMMENT '平均评分',
    avg_return DECIMAL(8,4) COMMENT '平均收益率',
    weight DECIMAL(5,4) COMMENT '权重',
    risk_level ENUM('low', 'medium', 'high') COMMENT '风险等级',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_sector (sector),
    INDEX idx_avg_score (avg_score DESC)
) COMMENT '行业分析数据表';
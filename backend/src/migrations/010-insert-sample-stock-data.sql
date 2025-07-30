-- 插入示例股票数据
-- 010-insert-sample-stock-data.sql

-- 1. 插入股票基础信息（只在不存在时插入）
INSERT IGNORE INTO stocks (id, symbol, name, sector, industry, market_cap, exchange, currency, country, is_active) VALUES
('stock-aapl', 'AAPL', '苹果公司', '科技', '消费电子', 3000000000000, 'NASDAQ', 'USD', 'US', true),
('stock-msft', 'MSFT', '微软公司', '科技', '软件服务', 2800000000000, 'NASDAQ', 'USD', 'US', true),
('stock-googl', 'GOOGL', '谷歌', '科技', '互联网服务', 1800000000000, 'NASDAQ', 'USD', 'US', true),
('stock-tsla', 'TSLA', '特斯拉', '汽车', '电动汽车', 800000000000, 'NASDAQ', 'USD', 'US', true),
('stock-amzn', 'AMZN', '亚马逊', '电商', '电子商务', 1600000000000, 'NASDAQ', 'USD', 'US', true),
('stock-nvda', 'NVDA', '英伟达', '科技', '半导体', 1200000000000, 'NASDAQ', 'USD', 'US', true),
('stock-meta', 'META', 'Meta', '科技', '社交媒体', 900000000000, 'NASDAQ', 'USD', 'US', true),
('stock-jpm', 'JPM', '摩根大通', '金融', '银行', 500000000000, 'NYSE', 'USD', 'US', true),
('stock-jnj', 'JNJ', '强生公司', '医疗', '制药', 450000000000, 'NYSE', 'USD', 'US', true),
('stock-ko', 'KO', '可口可乐', '消费', '饮料', 260000000000, 'NYSE', 'USD', 'US', true);

-- 2. 为现有策略插入股票推荐数据（只在不存在时插入）
INSERT IGNORE INTO stock_recommendations (id, strategy_id, stock_id, symbol, score, reason, target_price, risk_level, recommendation_type, confidence) 
SELECT 
    CONCAT('rec-', s.id, '-', st.symbol) as id,
    s.id as strategy_id,
    st.id as stock_id,
    st.symbol,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 88.0
        WHEN st.symbol = 'MSFT' THEN 85.0
        WHEN st.symbol = 'GOOGL' THEN 82.0
        WHEN st.symbol = 'TSLA' THEN 79.0
        WHEN st.symbol = 'AMZN' THEN 76.0
        ELSE 75.0
    END as score,
    CASE 
        WHEN st.symbol = 'AAPL' THEN '技术指标良好，基本面稳健，AI业务发展前景广阔'
        WHEN st.symbol = 'MSFT' THEN '云业务增长强劲，AI布局领先，企业服务稳定'
        WHEN st.symbol = 'GOOGL' THEN '搜索业务稳定，AI技术先进，广告收入增长'
        WHEN st.symbol = 'TSLA' THEN '电动汽车领导者，自动驾驶技术先进，市场份额扩大'
        WHEN st.symbol = 'AMZN' THEN '电商业务稳定，云服务AWS增长强劲，物流优势明显'
        ELSE '基本面良好，技术指标积极'
    END as reason,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 200.0
        WHEN st.symbol = 'MSFT' THEN 420.0
        WHEN st.symbol = 'GOOGL' THEN 160.0
        WHEN st.symbol = 'TSLA' THEN 280.0
        WHEN st.symbol = 'AMZN' THEN 180.0
        ELSE 150.0
    END as target_price,
    CASE 
        WHEN st.symbol IN ('AAPL', 'MSFT', 'JNJ', 'KO') THEN 'low'
        WHEN st.symbol IN ('GOOGL', 'AMZN', 'JPM') THEN 'medium'
        ELSE 'high'
    END as risk_level,
    CASE 
        WHEN st.symbol IN ('AAPL', 'MSFT', 'GOOGL') THEN 'BUY'
        WHEN st.symbol IN ('TSLA', 'AMZN') THEN 'HOLD'
        ELSE 'HOLD'
    END as recommendation_type,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 0.92
        WHEN st.symbol = 'MSFT' THEN 0.89
        WHEN st.symbol = 'GOOGL' THEN 0.85
        ELSE 0.80
    END as confidence
FROM strategies s
CROSS JOIN stocks st
WHERE s.strategy_type = 'stock_selection' 
AND st.symbol IN ('AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN');

-- 3. 为回测策略插入回测股票数据（只在不存在时插入）
INSERT IGNORE INTO backtest_stocks (id, strategy_id, stock_id, symbol, weight, performance, contribution, trades_count, avg_price, total_return, max_drawdown)
SELECT 
    CONCAT('bt-', s.id, '-', st.symbol) as id,
    s.id as strategy_id,
    st.id as stock_id,
    st.symbol,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 0.20
        WHEN st.symbol = 'MSFT' THEN 0.18
        WHEN st.symbol = 'GOOGL' THEN 0.15
        WHEN st.symbol = 'TSLA' THEN 0.12
        WHEN st.symbol = 'AMZN' THEN 0.10
        WHEN st.symbol = 'NVDA' THEN 0.08
        WHEN st.symbol = 'META' THEN 0.07
        WHEN st.symbol = 'JPM' THEN 0.10
        ELSE 0.05
    END as weight,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 15.6
        WHEN st.symbol = 'MSFT' THEN 22.3
        WHEN st.symbol = 'GOOGL' THEN 18.7
        WHEN st.symbol = 'TSLA' THEN 35.2
        WHEN st.symbol = 'AMZN' THEN 12.8
        WHEN st.symbol = 'NVDA' THEN 45.6
        WHEN st.symbol = 'META' THEN 28.9
        WHEN st.symbol = 'JPM' THEN 8.5
        ELSE 10.0
    END as performance,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 3.12
        WHEN st.symbol = 'MSFT' THEN 4.01
        WHEN st.symbol = 'GOOGL' THEN 2.81
        WHEN st.symbol = 'TSLA' THEN 4.22
        WHEN st.symbol = 'AMZN' THEN 1.28
        WHEN st.symbol = 'NVDA' THEN 3.65
        WHEN st.symbol = 'META' THEN 2.02
        WHEN st.symbol = 'JPM' THEN 0.85
        ELSE 1.0
    END as contribution,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 8
        WHEN st.symbol = 'MSFT' THEN 6
        WHEN st.symbol = 'GOOGL' THEN 5
        WHEN st.symbol = 'TSLA' THEN 12
        WHEN st.symbol = 'AMZN' THEN 4
        WHEN st.symbol = 'NVDA' THEN 9
        WHEN st.symbol = 'META' THEN 7
        WHEN st.symbol = 'JPM' THEN 3
        ELSE 5
    END as trades_count,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 175.50
        WHEN st.symbol = 'MSFT' THEN 380.25
        WHEN st.symbol = 'GOOGL' THEN 142.80
        WHEN st.symbol = 'TSLA' THEN 248.90
        WHEN st.symbol = 'AMZN' THEN 155.30
        WHEN st.symbol = 'NVDA' THEN 520.75
        WHEN st.symbol = 'META' THEN 325.40
        WHEN st.symbol = 'JPM' THEN 165.20
        ELSE 100.0
    END as avg_price,
    CASE 
        WHEN st.symbol = 'AAPL' THEN 0.156
        WHEN st.symbol = 'MSFT' THEN 0.223
        WHEN st.symbol = 'GOOGL' THEN 0.187
        WHEN st.symbol = 'TSLA' THEN 0.352
        WHEN st.symbol = 'AMZN' THEN 0.128
        WHEN st.symbol = 'NVDA' THEN 0.456
        WHEN st.symbol = 'META' THEN 0.289
        WHEN st.symbol = 'JPM' THEN 0.085
        ELSE 0.10
    END as total_return,
    CASE 
        WHEN st.symbol = 'AAPL' THEN -0.08
        WHEN st.symbol = 'MSFT' THEN -0.06
        WHEN st.symbol = 'GOOGL' THEN -0.09
        WHEN st.symbol = 'TSLA' THEN -0.15
        WHEN st.symbol = 'AMZN' THEN -0.12
        WHEN st.symbol = 'NVDA' THEN -0.11
        WHEN st.symbol = 'META' THEN -0.13
        WHEN st.symbol = 'JPM' THEN -0.05
        ELSE -0.10
    END as max_drawdown
FROM strategies s
CROSS JOIN stocks st
WHERE s.strategy_type = 'backtest' 
AND st.symbol IN ('AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'JPM');

-- 4. 插入股票价格历史数据（最近30天）
INSERT INTO stock_price_history (id, stock_id, symbol, date, open_price, high_price, low_price, close_price, volume, adj_close)
SELECT 
    CONCAT('price-', st.id, '-', DATE_FORMAT(d.date, '%Y%m%d')) as id,
    st.id as stock_id,
    st.symbol,
    d.date,
    CASE st.symbol
        WHEN 'AAPL' THEN 175.0 + (RAND() - 0.5) * 10
        WHEN 'MSFT' THEN 380.0 + (RAND() - 0.5) * 20
        WHEN 'GOOGL' THEN 140.0 + (RAND() - 0.5) * 15
        WHEN 'TSLA' THEN 250.0 + (RAND() - 0.5) * 30
        WHEN 'AMZN' THEN 155.0 + (RAND() - 0.5) * 12
        WHEN 'NVDA' THEN 520.0 + (RAND() - 0.5) * 40
        WHEN 'META' THEN 325.0 + (RAND() - 0.5) * 25
        WHEN 'JPM' THEN 165.0 + (RAND() - 0.5) * 8
        WHEN 'JNJ' THEN 160.0 + (RAND() - 0.5) * 6
        WHEN 'KO' THEN 60.0 + (RAND() - 0.5) * 3
        ELSE 100.0 + (RAND() - 0.5) * 10
    END as open_price,
    CASE st.symbol
        WHEN 'AAPL' THEN 175.0 + (RAND() - 0.5) * 10 + 2
        WHEN 'MSFT' THEN 380.0 + (RAND() - 0.5) * 20 + 3
        WHEN 'GOOGL' THEN 140.0 + (RAND() - 0.5) * 15 + 2
        WHEN 'TSLA' THEN 250.0 + (RAND() - 0.5) * 30 + 5
        WHEN 'AMZN' THEN 155.0 + (RAND() - 0.5) * 12 + 2
        WHEN 'NVDA' THEN 520.0 + (RAND() - 0.5) * 40 + 8
        WHEN 'META' THEN 325.0 + (RAND() - 0.5) * 25 + 4
        WHEN 'JPM' THEN 165.0 + (RAND() - 0.5) * 8 + 1
        WHEN 'JNJ' THEN 160.0 + (RAND() - 0.5) * 6 + 1
        WHEN 'KO' THEN 60.0 + (RAND() - 0.5) * 3 + 0.5
        ELSE 100.0 + (RAND() - 0.5) * 10 + 2
    END as high_price,
    CASE st.symbol
        WHEN 'AAPL' THEN 175.0 + (RAND() - 0.5) * 10 - 2
        WHEN 'MSFT' THEN 380.0 + (RAND() - 0.5) * 20 - 3
        WHEN 'GOOGL' THEN 140.0 + (RAND() - 0.5) * 15 - 2
        WHEN 'TSLA' THEN 250.0 + (RAND() - 0.5) * 30 - 5
        WHEN 'AMZN' THEN 155.0 + (RAND() - 0.5) * 12 - 2
        WHEN 'NVDA' THEN 520.0 + (RAND() - 0.5) * 40 - 8
        WHEN 'META' THEN 325.0 + (RAND() - 0.5) * 25 - 4
        WHEN 'JPM' THEN 165.0 + (RAND() - 0.5) * 8 - 1
        WHEN 'JNJ' THEN 160.0 + (RAND() - 0.5) * 6 - 1
        WHEN 'KO' THEN 60.0 + (RAND() - 0.5) * 3 - 0.5
        ELSE 100.0 + (RAND() - 0.5) * 10 - 2
    END as low_price,
    CASE st.symbol
        WHEN 'AAPL' THEN 175.0 + (RAND() - 0.5) * 10
        WHEN 'MSFT' THEN 380.0 + (RAND() - 0.5) * 20
        WHEN 'GOOGL' THEN 140.0 + (RAND() - 0.5) * 15
        WHEN 'TSLA' THEN 250.0 + (RAND() - 0.5) * 30
        WHEN 'AMZN' THEN 155.0 + (RAND() - 0.5) * 12
        WHEN 'NVDA' THEN 520.0 + (RAND() - 0.5) * 40
        WHEN 'META' THEN 325.0 + (RAND() - 0.5) * 25
        WHEN 'JPM' THEN 165.0 + (RAND() - 0.5) * 8
        WHEN 'JNJ' THEN 160.0 + (RAND() - 0.5) * 6
        WHEN 'KO' THEN 60.0 + (RAND() - 0.5) * 3
        ELSE 100.0 + (RAND() - 0.5) * 10
    END as close_price,
    FLOOR(1000000 + RAND() * 5000000) as volume,
    CASE st.symbol
        WHEN 'AAPL' THEN 175.0 + (RAND() - 0.5) * 10
        WHEN 'MSFT' THEN 380.0 + (RAND() - 0.5) * 20
        WHEN 'GOOGL' THEN 140.0 + (RAND() - 0.5) * 15
        WHEN 'TSLA' THEN 250.0 + (RAND() - 0.5) * 30
        WHEN 'AMZN' THEN 155.0 + (RAND() - 0.5) * 12
        WHEN 'NVDA' THEN 520.0 + (RAND() - 0.5) * 40
        WHEN 'META' THEN 325.0 + (RAND() - 0.5) * 25
        WHEN 'JPM' THEN 165.0 + (RAND() - 0.5) * 8
        WHEN 'JNJ' THEN 160.0 + (RAND() - 0.5) * 6
        WHEN 'KO' THEN 60.0 + (RAND() - 0.5) * 3
        ELSE 100.0 + (RAND() - 0.5) * 10
    END as adj_close
FROM stocks st
CROSS JOIN (
    SELECT DATE_SUB(CURDATE(), INTERVAL n DAY) as date
    FROM (
        SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
        SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION
        SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION
        SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION
        SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION
        SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29
    ) numbers
    WHERE WEEKDAY(DATE_SUB(CURDATE(), INTERVAL n DAY)) < 5  -- 只包含工作日
) d;

-- 5. 插入技术分析数据
INSERT INTO technical_analysis (id, stock_id, symbol, date, rsi, macd, macd_signal, macd_histogram, ma5, ma10, ma20, ma50, support_level, resistance_level, trend, strength)
SELECT 
    CONCAT('tech-', st.id, '-', DATE_FORMAT(CURDATE(), '%Y%m%d')) as id,
    st.id as stock_id,
    st.symbol,
    CURDATE() as date,
    CASE st.symbol
        WHEN 'AAPL' THEN 65.2
        WHEN 'MSFT' THEN 58.7
        WHEN 'GOOGL' THEN 52.3
        WHEN 'TSLA' THEN 72.1
        WHEN 'AMZN' THEN 48.9
        WHEN 'NVDA' THEN 78.5
        WHEN 'META' THEN 61.4
        WHEN 'JPM' THEN 45.6
        WHEN 'JNJ' THEN 42.3
        WHEN 'KO' THEN 38.7
        ELSE 50.0
    END as rsi,
    CASE st.symbol
        WHEN 'AAPL' THEN 2.15
        WHEN 'MSFT' THEN 1.87
        WHEN 'GOOGL' THEN -0.45
        WHEN 'TSLA' THEN 3.21
        WHEN 'AMZN' THEN -1.23
        WHEN 'NVDA' THEN 4.56
        WHEN 'META' THEN 1.98
        WHEN 'JPM' THEN -0.78
        WHEN 'JNJ' THEN -0.34
        WHEN 'KO' THEN -0.12
        ELSE 0.0
    END as macd,
    CASE st.symbol
        WHEN 'AAPL' THEN 1.98
        WHEN 'MSFT' THEN 1.65
        WHEN 'GOOGL' THEN -0.23
        WHEN 'TSLA' THEN 2.87
        WHEN 'AMZN' THEN -0.98
        WHEN 'NVDA' THEN 4.12
        WHEN 'META' THEN 1.76
        WHEN 'JPM' THEN -0.56
        WHEN 'JNJ' THEN -0.21
        WHEN 'KO' THEN 0.05
        ELSE 0.0
    END as macd_signal,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.17
        WHEN 'MSFT' THEN 0.22
        WHEN 'GOOGL' THEN -0.22
        WHEN 'TSLA' THEN 0.34
        WHEN 'AMZN' THEN -0.25
        WHEN 'NVDA' THEN 0.44
        WHEN 'META' THEN 0.22
        WHEN 'JPM' THEN -0.22
        WHEN 'JNJ' THEN -0.13
        WHEN 'KO' THEN -0.17
        ELSE 0.0
    END as macd_histogram,
    CASE st.symbol
        WHEN 'AAPL' THEN 178.5
        WHEN 'MSFT' THEN 385.2
        WHEN 'GOOGL' THEN 143.7
        WHEN 'TSLA' THEN 255.8
        WHEN 'AMZN' THEN 158.3
        WHEN 'NVDA' THEN 535.6
        WHEN 'META' THEN 332.1
        WHEN 'JPM' THEN 167.4
        WHEN 'JNJ' THEN 162.8
        WHEN 'KO' THEN 61.2
        ELSE 105.0
    END as ma5,
    CASE st.symbol
        WHEN 'AAPL' THEN 176.2
        WHEN 'MSFT' THEN 382.8
        WHEN 'GOOGL' THEN 141.9
        WHEN 'TSLA' THEN 252.4
        WHEN 'AMZN' THEN 156.7
        WHEN 'NVDA' THEN 528.3
        WHEN 'META' THEN 328.9
        WHEN 'JPM' THEN 165.8
        WHEN 'JNJ' THEN 161.2
        WHEN 'KO' THEN 60.8
        ELSE 102.0
    END as ma10,
    CASE st.symbol
        WHEN 'AAPL' THEN 173.8
        WHEN 'MSFT' THEN 378.5
        WHEN 'GOOGL' THEN 139.2
        WHEN 'TSLA' THEN 248.7
        WHEN 'AMZN' THEN 154.1
        WHEN 'NVDA' THEN 515.9
        WHEN 'META' THEN 322.6
        WHEN 'JPM' THEN 163.2
        WHEN 'JNJ' THEN 158.9
        WHEN 'KO' THEN 59.8
        ELSE 98.0
    END as ma20,
    CASE st.symbol
        WHEN 'AAPL' THEN 168.5
        WHEN 'MSFT' THEN 365.2
        WHEN 'GOOGL' THEN 135.8
        WHEN 'TSLA' THEN 235.6
        WHEN 'AMZN' THEN 148.9
        WHEN 'NVDA' THEN 485.7
        WHEN 'META' THEN 308.4
        WHEN 'JPM' THEN 158.7
        WHEN 'JNJ' THEN 154.2
        WHEN 'KO' THEN 58.3
        ELSE 92.0
    END as ma50,
    CASE st.symbol
        WHEN 'AAPL' THEN 165.0
        WHEN 'MSFT' THEN 360.0
        WHEN 'GOOGL' THEN 132.0
        WHEN 'TSLA' THEN 230.0
        WHEN 'AMZN' THEN 145.0
        WHEN 'NVDA' THEN 480.0
        WHEN 'META' THEN 305.0
        WHEN 'JPM' THEN 155.0
        WHEN 'JNJ' THEN 152.0
        WHEN 'KO' THEN 57.0
        ELSE 90.0
    END as support_level,
    CASE st.symbol
        WHEN 'AAPL' THEN 185.0
        WHEN 'MSFT' THEN 400.0
        WHEN 'GOOGL' THEN 150.0
        WHEN 'TSLA' THEN 280.0
        WHEN 'AMZN' THEN 170.0
        WHEN 'NVDA' THEN 560.0
        WHEN 'META' THEN 350.0
        WHEN 'JPM' THEN 175.0
        WHEN 'JNJ' THEN 170.0
        WHEN 'KO' THEN 65.0
        ELSE 110.0
    END as resistance_level,
    CASE 
        WHEN st.symbol IN ('AAPL', 'MSFT', 'TSLA', 'NVDA', 'META') THEN 'bullish'
        WHEN st.symbol IN ('GOOGL', 'AMZN') THEN 'neutral'
        ELSE 'bearish'
    END as trend,
    CASE 
        WHEN st.symbol IN ('NVDA', 'TSLA') THEN 'strong'
        WHEN st.symbol IN ('AAPL', 'MSFT', 'META') THEN 'moderate'
        ELSE 'weak'
    END as strength
FROM stocks st;

-- 6. 插入基本面分析数据
INSERT INTO fundamental_analysis (id, stock_id, symbol, report_date, pe_ratio, pb_ratio, roe, roa, debt_to_equity, current_ratio, quick_ratio, gross_margin, operating_margin, net_margin, dividend_yield)
SELECT 
    CONCAT('fund-', st.id, '-', DATE_FORMAT(CURDATE(), '%Y%m%d')) as id,
    st.id as stock_id,
    st.symbol,
    CURDATE() as report_date,
    CASE st.symbol
        WHEN 'AAPL' THEN 28.5
        WHEN 'MSFT' THEN 32.1
        WHEN 'GOOGL' THEN 24.8
        WHEN 'TSLA' THEN 65.2
        WHEN 'AMZN' THEN 45.7
        WHEN 'NVDA' THEN 72.3
        WHEN 'META' THEN 22.9
        WHEN 'JPM' THEN 12.8
        WHEN 'JNJ' THEN 15.6
        WHEN 'KO' THEN 26.4
        ELSE 20.0
    END as pe_ratio,
    CASE st.symbol
        WHEN 'AAPL' THEN 8.9
        WHEN 'MSFT' THEN 12.5
        WHEN 'GOOGL' THEN 5.8
        WHEN 'TSLA' THEN 15.2
        WHEN 'AMZN' THEN 8.7
        WHEN 'NVDA' THEN 22.1
        WHEN 'META' THEN 6.4
        WHEN 'JPM' THEN 1.8
        WHEN 'JNJ' THEN 5.2
        WHEN 'KO' THEN 6.8
        ELSE 3.0
    END as pb_ratio,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.312
        WHEN 'MSFT' THEN 0.389
        WHEN 'GOOGL' THEN 0.234
        WHEN 'TSLA' THEN 0.234
        WHEN 'AMZN' THEN 0.191
        WHEN 'NVDA' THEN 0.305
        WHEN 'META' THEN 0.279
        WHEN 'JPM' THEN 0.141
        WHEN 'JNJ' THEN 0.334
        WHEN 'KO' THEN 0.258
        ELSE 0.15
    END as roe,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.278
        WHEN 'MSFT' THEN 0.189
        WHEN 'GOOGL' THEN 0.134
        WHEN 'TSLA' THEN 0.089
        WHEN 'AMZN' THEN 0.067
        WHEN 'NVDA' THEN 0.223
        WHEN 'META' THEN 0.156
        WHEN 'JPM' THEN 0.012
        WHEN 'JNJ' THEN 0.089
        WHEN 'KO' THEN 0.098
        ELSE 0.08
    END as roa,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.12
        WHEN 'MSFT' THEN 0.08
        WHEN 'GOOGL' THEN 0.05
        WHEN 'TSLA' THEN 0.15
        WHEN 'AMZN' THEN 0.18
        WHEN 'NVDA' THEN 0.03
        WHEN 'META' THEN 0.02
        WHEN 'JPM' THEN 1.25
        WHEN 'JNJ' THEN 0.45
        WHEN 'KO' THEN 1.89
        ELSE 0.5
    END as debt_to_equity,
    CASE st.symbol
        WHEN 'AAPL' THEN 1.05
        WHEN 'MSFT' THEN 2.89
        WHEN 'GOOGL' THEN 2.45
        WHEN 'TSLA' THEN 1.89
        WHEN 'AMZN' THEN 1.12
        WHEN 'NVDA' THEN 3.45
        WHEN 'META' THEN 2.78
        WHEN 'JPM' THEN 1.23
        WHEN 'JNJ' THEN 1.67
        WHEN 'KO' THEN 1.34
        ELSE 1.5
    END as current_ratio,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.89
        WHEN 'MSFT' THEN 2.34
        WHEN 'GOOGL' THEN 2.12
        WHEN 'TSLA' THEN 1.45
        WHEN 'AMZN' THEN 0.98
        WHEN 'NVDA' THEN 2.89
        WHEN 'META' THEN 2.34
        WHEN 'JPM' THEN 1.12
        WHEN 'JNJ' THEN 1.23
        WHEN 'KO' THEN 1.01
        ELSE 1.2
    END as quick_ratio,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.434
        WHEN 'MSFT' THEN 0.689
        WHEN 'GOOGL' THEN 0.567
        WHEN 'TSLA' THEN 0.189
        WHEN 'AMZN' THEN 0.456
        WHEN 'NVDA' THEN 0.734
        WHEN 'META' THEN 0.812
        WHEN 'JPM' THEN 0.234
        WHEN 'JNJ' THEN 0.678
        WHEN 'KO' THEN 0.598
        ELSE 0.4
    END as gross_margin,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.298
        WHEN 'MSFT' THEN 0.423
        WHEN 'GOOGL' THEN 0.234
        WHEN 'TSLA' THEN 0.089
        WHEN 'AMZN' THEN 0.056
        WHEN 'NVDA' THEN 0.345
        WHEN 'META' THEN 0.289
        WHEN 'JPM' THEN 0.189
        WHEN 'JNJ' THEN 0.234
        WHEN 'KO' THEN 0.298
        ELSE 0.2
    END as operating_margin,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.234
        WHEN 'MSFT' THEN 0.367
        WHEN 'GOOGL' THEN 0.189
        WHEN 'TSLA' THEN 0.067
        WHEN 'AMZN' THEN 0.034
        WHEN 'NVDA' THEN 0.289
        WHEN 'META' THEN 0.234
        WHEN 'JPM' THEN 0.156
        WHEN 'JNJ' THEN 0.189
        WHEN 'KO' THEN 0.234
        ELSE 0.15
    END as net_margin,
    CASE st.symbol
        WHEN 'AAPL' THEN 0.0045
        WHEN 'MSFT' THEN 0.0067
        WHEN 'GOOGL' THEN 0.0000
        WHEN 'TSLA' THEN 0.0000
        WHEN 'AMZN' THEN 0.0000
        WHEN 'NVDA' THEN 0.0034
        WHEN 'META' THEN 0.0000
        WHEN 'JPM' THEN 0.0289
        WHEN 'JNJ' THEN 0.0298
        WHEN 'KO' THEN 0.0312
        ELSE 0.02
    END as dividend_yield
FROM stocks st;

-- 7. 插入行业分析数据
INSERT INTO sector_analysis (id, strategy_id, sector, stock_count, avg_score, avg_return, weight, risk_level)
SELECT 
    CONCAT('sector-', s.id, '-', sector_name) as id,
    s.id as strategy_id,
    sector_name as sector,
    stock_count,
    avg_score,
    avg_return,
    weight,
    risk_level
FROM strategies s
CROSS JOIN (
    SELECT '科技' as sector_name, 15 as stock_count, 85.5 as avg_score, 0.185 as avg_return, 0.65 as weight, 'medium' as risk_level
    UNION ALL
    SELECT '金融' as sector_name, 8 as stock_count, 78.2 as avg_score, 0.089 as avg_return, 0.15 as weight, 'low' as risk_level
    UNION ALL
    SELECT '医疗' as sector_name, 5 as stock_count, 82.1 as avg_score, 0.123 as avg_return, 0.10 as weight, 'low' as risk_level
    UNION ALL
    SELECT '消费' as sector_name, 3 as stock_count, 75.8 as avg_score, 0.067 as avg_return, 0.05 as weight, 'low' as risk_level
    UNION ALL
    SELECT '汽车' as sector_name, 2 as stock_count, 79.5 as avg_score, 0.234 as avg_return, 0.05 as weight, 'high' as risk_level
) sectors
WHERE s.strategy_type IN ('stock_selection', 'backtest');
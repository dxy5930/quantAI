-- 修复字符集问题的脚本
-- 如果表已存在但字符集不正确，先删除再重新创建

-- 删除已存在的表（按外键依赖关系倒序删除）
DROP TABLE IF EXISTS node_config_options;
DROP TABLE IF EXISTS node_config_fields;
DROP TABLE IF EXISTS node_types;

-- 重新创建节点类型表
CREATE TABLE node_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL UNIQUE COMMENT '节点类型（data, analysis, strategy, risk, output, custom）',
    name VARCHAR(100) NOT NULL COMMENT '节点类型显示名称',
    description TEXT COMMENT '节点类型描述',
    icon VARCHAR(50) COMMENT '图标名称',
    color VARCHAR(50) COMMENT '颜色主题',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点类型配置表';

-- 重新创建节点配置项表
CREATE TABLE node_config_fields (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    node_type VARCHAR(50) NOT NULL COMMENT '节点类型',
    field_key VARCHAR(100) NOT NULL COMMENT '配置项键名',
    field_name VARCHAR(100) NOT NULL COMMENT '配置项显示名称',
    field_type ENUM('text', 'number', 'select', 'multiselect', 'boolean', 'range') NOT NULL COMMENT '配置项类型',
    is_required BOOLEAN DEFAULT FALSE COMMENT '是否必填',
    default_value TEXT COMMENT '默认值',
    placeholder VARCHAR(200) COMMENT '占位符文本',
    description TEXT COMMENT '配置项描述',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (node_type) REFERENCES node_types(type) ON DELETE CASCADE,
    UNIQUE KEY unique_node_field (node_type, field_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点配置项表';

-- 重新创建配置选项表（用于下拉选择）
CREATE TABLE node_config_options (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_field_id BIGINT NOT NULL COMMENT '配置项ID',
    option_value VARCHAR(100) NOT NULL COMMENT '选项值',
    option_label VARCHAR(100) NOT NULL COMMENT '选项显示名称',
    option_description TEXT COMMENT '选项描述',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (config_field_id) REFERENCES node_config_fields(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点配置选项表';

-- 插入基础节点类型数据
INSERT INTO node_types (type, name, description, icon, color) VALUES
('data', '数据收集', '收集股票数据、财务数据、新闻等', 'Database', 'blue'),
('analysis', '分析处理', '进行技术分析和基本面分析', 'BarChart3', 'green'),
('strategy', '策略生成', '基于分析结果生成投资策略', 'Target', 'purple'),
('risk', '风险评估', '评估策略风险和回测表现', 'Shield', 'orange'),
('output', '结果输出', '生成最终投资建议和报告', 'Zap', 'red'),
('custom', '自定义', '用户自定义的处理节点', 'Bot', 'gray');

-- 插入数据收集节点的配置项
INSERT INTO node_config_fields (node_type, field_key, field_name, field_type, is_required, default_value, placeholder, description, sort_order) VALUES
('data', 'dataSources', '数据源', 'multiselect', true, '["stock_price"]', '选择数据源', '选择要收集的数据类型', 1),
('data', 'timeRange', '时间范围', 'select', true, '1y', '选择时间范围', '数据收集的时间范围', 2),
('data', 'symbols', '股票代码', 'text', false, '', '输入股票代码，多个用逗号分隔', '指定要分析的股票代码', 3);

-- 插入技术分析节点的配置项
INSERT INTO node_config_fields (node_type, field_key, field_name, field_type, is_required, default_value, placeholder, description, sort_order) VALUES
('analysis', 'indicators', '技术指标', 'multiselect', true, '["MA", "RSI"]', '选择技术指标', '选择要计算的技术指标', 1),
('analysis', 'period', '周期', 'number', true, '20', '输入计算周期', '技术指标的计算周期', 2),
('analysis', 'analysisType', '分析类型', 'select', true, 'technical', '选择分析类型', '选择分析的类型', 3);

-- 插入策略生成节点的配置项
INSERT INTO node_config_fields (node_type, field_key, field_name, field_type, is_required, default_value, placeholder, description, sort_order) VALUES
('strategy', 'strategyType', '策略类型', 'select', true, 'momentum', '选择策略类型', '选择投资策略的类型', 1),
('strategy', 'riskLevel', '风险等级', 'select', true, 'medium', '选择风险等级', '策略的风险承受等级', 2),
('strategy', 'timeHorizon', '投资期限', 'select', true, 'medium_term', '选择投资期限', '策略的投资时间范围', 3);

-- 插入风险评估节点的配置项
INSERT INTO node_config_fields (node_type, field_key, field_name, field_type, is_required, default_value, placeholder, description, sort_order) VALUES
('risk', 'riskMetrics', '风险指标', 'multiselect', true, '["VaR", "Sharpe"]', '选择风险指标', '选择要计算的风险评估指标', 1),
('risk', 'backtestPeriod', '回测周期', 'select', true, '2y', '选择回测周期', '策略回测的时间周期', 2),
('risk', 'confidenceLevel', '置信水平', 'select', false, '95', '选择置信水平', 'VaR计算的置信水平', 3);

-- 插入结果输出节点的配置项
INSERT INTO node_config_fields (node_type, field_key, field_name, field_type, is_required, default_value, placeholder, description, sort_order) VALUES
('output', 'outputFormat', '输出格式', 'select', true, 'detailed_report', '选择输出格式', '选择结果输出的格式', 1),
('output', 'includeCharts', '包含图表', 'boolean', false, 'true', '', '是否在报告中包含图表', 2),
('output', 'language', '报告语言', 'select', false, 'zh', '选择语言', '报告的语言设置', 3);

-- 插入数据源选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'dataSources'), 'stock_price', '股价数据', '包含开盘价、收盘价、最高价、最低价等', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'dataSources'), 'financial_data', '财务数据', '包含财务报表、财务指标等', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'dataSources'), 'news', '新闻数据', '相关新闻和公告信息', 3),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'dataSources'), 'market_data', '市场数据', '市场整体数据和指数信息', 4);

-- 插入时间范围选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '1w', '1周', '最近1周的数据', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '1m', '1个月', '最近1个月的数据', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '3m', '3个月', '最近3个月的数据', 3),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '6m', '6个月', '最近6个月的数据', 4),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '1y', '1年', '最近1年的数据', 5),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '2y', '2年', '最近2年的数据', 6),
((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '5y', '5年', '最近5年的数据', 7);

-- 插入技术指标选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'indicators'), 'MA', '移动平均线', '简单移动平均线指标', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'indicators'), 'EMA', '指数移动平均', '指数加权移动平均线', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'indicators'), 'RSI', 'RSI相对强弱', '相对强弱指数', 3),
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'indicators'), 'MACD', 'MACD指标', '指数平滑异同移动平均线', 4),
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'indicators'), 'KDJ', 'KDJ指标', '随机指标', 5),
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'indicators'), 'BOLL', '布林带', '布林线指标', 6);

-- 插入分析类型选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'analysisType'), 'technical', '技术分析', '基于价格和成交量的技术指标分析', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'analysisType'), 'fundamental', '基本面分析', '基于财务数据的基本面分析', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'analysis' AND field_key = 'analysisType'), 'sentiment', '情绪分析', '基于新闻和市场情绪的分析', 3);

-- 插入策略类型选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'strategyType'), 'momentum', '动量策略', '基于价格动量的投资策略', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'strategyType'), 'mean_reversion', '均值回归', '基于价格均值回归的策略', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'strategyType'), 'value', '价值投资', '基于价值低估的投资策略', 3),
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'strategyType'), 'growth', '成长投资', '基于公司成长性的投资策略', 4);

-- 插入风险等级选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'riskLevel'), 'low', '低风险', '保守型投资策略', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'riskLevel'), 'medium', '中等风险', '平衡型投资策略', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'riskLevel'), 'high', '高风险', '激进型投资策略', 3);

-- 插入投资期限选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'timeHorizon'), 'short_term', '短期', '1-3个月的投资期限', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'timeHorizon'), 'medium_term', '中期', '3-12个月的投资期限', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'strategy' AND field_key = 'timeHorizon'), 'long_term', '长期', '1年以上的投资期限', 3);

-- 插入风险指标选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'riskMetrics'), 'VaR', '风险价值', '在给定置信水平下的最大可能损失', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'riskMetrics'), 'Sharpe', '夏普比率', '风险调整后的收益率指标', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'riskMetrics'), 'MaxDrawdown', '最大回撤', '投资组合的最大亏损幅度', 3),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'riskMetrics'), 'Beta', 'Beta系数', '相对于市场的系统性风险', 4),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'riskMetrics'), 'Alpha', 'Alpha系数', '超额收益率指标', 5);

-- 插入回测周期选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'backtestPeriod'), '3m', '3个月', '3个月回测周期', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'backtestPeriod'), '6m', '6个月', '6个月回测周期', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'backtestPeriod'), '1y', '1年', '1年回测周期', 3),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'backtestPeriod'), '2y', '2年', '2年回测周期', 4),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'backtestPeriod'), '5y', '5年', '5年回测周期', 5);

-- 插入置信水平选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'confidenceLevel'), '90', '90%', '90%置信水平', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'confidenceLevel'), '95', '95%', '95%置信水平', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'risk' AND field_key = 'confidenceLevel'), '99', '99%', '99%置信水平', 3);

-- 插入输出格式选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'output' AND field_key = 'outputFormat'), 'summary', '摘要报告', '简化的投资建议摘要', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'output' AND field_key = 'outputFormat'), 'detailed_report', '详细报告', '完整的分析和投资建议报告', 2),
((SELECT id FROM node_config_fields WHERE node_type = 'output' AND field_key = 'outputFormat'), 'json_data', 'JSON数据', '结构化的JSON格式数据', 3),
((SELECT id FROM node_config_fields WHERE node_type = 'output' AND field_key = 'outputFormat'), 'excel_export', 'Excel导出', 'Excel格式的数据和图表', 4);

-- 插入语言选项
INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
((SELECT id FROM node_config_fields WHERE node_type = 'output' AND field_key = 'language'), 'zh', '中文', '中文报告', 1),
((SELECT id FROM node_config_fields WHERE node_type = 'output' AND field_key = 'language'), 'en', 'English', '英文报告', 2); 
# 股票数据爬虫系统

基于 Python 和 akshare 的股票数据爬取系统，支持爬取沪市、深市、科创板、创业板、北交所等市场的股票数据。

## 功能特性

- 🚀 支持多市场股票数据爬取（沪市、深市、科创板、创业板、北交所）
- 📊 实时股票行情数据获取
- 📈 历史交易数据爬取
- 🏢 F10公司基本信息获取
- 💰 财务数据和分红配股信息
- 🗄️ 自动数据库存储和更新
- ⏰ 定时任务支持
- 📝 完整的日志记录

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置

1. 复制 `.env` 文件并修改数据库配置：

```bash
cp .env .env.local
```

2. 修改 `.env` 中的数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stock_trading_system
```

## 使用方法

### 基本用法

```bash
# 爬取所有数据（推荐）
python main.py --mode all

# 只爬取基本股票数据
python main.py --mode basic

# 爬取指定股票的历史数据
python main.py --mode historical --symbol 000001 --days 30

# 测试数据库连接
python main.py --mode test
```

### 参数说明

- `--mode`: 爬取模式
  - `all`: 爬取所有数据（股票基本信息、F10信息、财务数据）
  - `basic`: 只爬取股票基本信息和当日交易数据
  - `historical`: 爬取指定股票的历史数据
  - `test`: 测试数据库连接

- `--symbol`: 股票代码（历史数据模式使用）
- `--days`: 历史数据天数（默认30天）

## 数据表结构

### stock_info - 股票基本信息
- symbol: 股票代码
- name: 股票名称
- industry: 所属行业
- sector: 板块（主板、科创板、创业板等）
- market: 市场（SH、SZ、BJ）
- listDate: 上市日期
- marketCap: 总市值
- circulationMarketCap: 流通市值
- totalShares: 总股本
- circulationShares: 流通股本
- peRatio: 市盈率
- pbRatio: 市净率
- dividendYield: 股息率
- isActive: 是否活跃

### stock_data - 股票交易数据
- symbol: 股票代码
- name: 股票名称
- date: 交易日期
- open: 开盘价
- high: 最高价
- low: 最低价
- close: 收盘价
- volume: 成交量
- amount: 成交额
- changePercent: 涨跌幅
- changeAmount: 涨跌额
- turnoverRate: 换手率

### stock_f10 - F10基本信息
- symbol: 股票代码
- companyName: 公司名称
- industry: 所属行业
- mainBusiness: 主营业务
- businessScope: 经营范围
- listDate: 上市时间
- totalShares: 总股本
- circulationShares: 流通股
- chairman: 董事长
- generalManager: 总经理
- secretary: 董秘
- employees: 员工人数
- website: 公司网址
- address: 办公地址
- introduction: 公司简介

### stock_financial - 财务数据
- symbol: 股票代码
- reportDate: 报告期
- revenue: 营业收入
- netProfit: 净利润
- totalAssets: 总资产
- totalLiabilities: 总负债
- shareholderEquity: 股东权益
- operatingCashFlow: 经营现金流
- eps: 每股收益
- roe: 净资产收益率
- roa: 总资产收益率
- grossMargin: 毛利率
- netMargin: 净利率
- debtRatio: 资产负债率

## 市场覆盖

- **沪市A股**: 主板股票（60开头）
- **深市A股**: 主板股票（00开头）
- **科创板**: 科创板股票（688开头）
- **创业板**: 创业板股票（300开头）
- **北交所**: 北交所股票（8、4开头）

## 注意事项

1. **请求频率**: 程序内置了请求延迟，避免对数据源造成过大压力
2. **数据准确性**: 数据来源于公开接口，仅供参考，不构成投资建议
3. **异常处理**: 程序具有完善的异常处理机制，单只股票失败不会影响整体爬取
4. **日志记录**: 所有操作都有详细的日志记录，便于问题排查

## 定时任务

可以配合系统的定时任务工具（如 crontab）实现自动化爬取：

```bash
# 每天早上9点执行完整爬取
0 9 * * * /usr/bin/python3 /path/to/stock-crawler/main.py --mode all

# 每天下午3点执行基本数据更新
0 15 * * * /usr/bin/python3 /path/to/stock-crawler/main.py --mode basic
```

## 日志文件

日志文件默认保存在 `logs/crawler.log`，支持自动轮转和压缩。

## 故障排除

1. **数据库连接失败**: 检查数据库配置和网络连接
2. **akshare 接口异常**: 检查网络连接，可能需要等待一段时间后重试
3. **内存不足**: 可以调整批处理大小（BATCH_SIZE）
4. **权限问题**: 确保有数据库写入权限和日志文件写入权限

## 开发说明

- `config.py`: 配置文件
- `database.py`: 数据库操作
- `crawler.py`: 爬虫核心逻辑
- `main.py`: 主程序入口

## 许可证

MIT License
# 股票推荐AI分析服务

## 🆕 新功能：无缓存实时AI分析

**版本 2.0 更新 (2025-01-27)**

- ✅ **关键词分析不使用缓存**：每次请求都通过通义千问AI重新分析，确保最新、最准确的结果
- ✅ **股票推荐实时分析**：基于最新AI关键词分析结果进行股票推荐，不使用缓存
- ✅ **AI增强匹配算法**：结合AI分析的行业、概念、财务、技术关键词进行精准匹配
- ✅ **情感分析集成**：AI分析用户查询的情感倾向，影响推荐评分
- ✅ **置信度加权**：根据AI分析的置信度调整推荐结果

### 关键改进

1. **去除缓存机制**：
   - 关键词分析接口：每次都用AI重新分析，不读取缓存
   - 股票推荐接口：不缓存推荐结果，确保基于最新AI分析

2. **AI分析增强**：
   - 优先使用AI分析，规则分析作为补充
   - 支持行业、概念、财务、技术等多维度关键词提取
   - 情感分析和查询意图识别

3. **智能匹配评分**：
   - AI关键词匹配权重40%
   - 基础匹配权重30%  
   - 财务指标匹配权重20%
   - 市值加权10%
   - AI置信度额外加权

## 📋 简介

这是一个基于AI的智能股票推荐分析服务，使用通义千问AI进行关键词分析，结合MySQL数据库中的股票数据，为用户提供精准的股票推荐。系统支持自然语言查询，能够理解用户的投资意图并推荐相关股票。

## 🚀 核心功能

- **🧠 AI关键词分析**: 使用通义千问AI智能分析用户查询，提取投资相关关键词
- **📊 智能股票推荐**: 基于关键词分析结果从数据库推荐相关股票
- **🎯 多维度匹配**: 支持行业、概念、财务指标、技术指标等多维度匹配
- **⚖️ 风险评估**: 自动评估推荐股票的风险等级
- **💾 缓存优化**: Redis缓存提升响应速度
- **🔍 灵活过滤**: 支持市值、PE、ROE等条件过滤

## 🛠 技术栈

- **FastAPI**: 高性能异步Web框架
- **通义千问**: AI关键词分析和语义理解
- **MySQL**: 股票数据存储
- **SQLAlchemy**: 数据库ORM
- **Redis**: 缓存系统
- **pandas**: 数据分析
- **Pydantic**: 数据验证

## 📁 项目结构

```
python-analysis-service/
├── main.py                          # 主服务文件
├── config.py                        # 配置管理
├── requirements.txt                 # Python依赖
├── .env                            # 环境配置
├── .env.example                    # 环境配置示例
├── Dockerfile                      # Docker配置
├── docker-compose.yml              # Docker Compose配置
├── API_USAGE_GUIDE.md              # API使用说明文档
├── test_recommendation_api.py      # API测试脚本
├── api/                            # API接口层
│   ├── stock_recommendation_api.py    # 股票推荐API
│   └── smart_stock_api.py            # 智能选股API
├── services/                       # 业务服务层
│   ├── keyword_analyzer.py           # 关键词分析服务
│   ├── stock_recommender.py          # 股票推荐服务
│   ├── qwen_analyzer.py              # 通义千问分析器
│   ├── data_analyzer.py              # 数据分析服务
│   ├── smart_stock_service.py        # 智能选股服务
│   └── database_service.py           # 数据库服务
├── models/                         # 数据模型
│   ├── stock_models.py               # 股票数据模型
│   └── database.py                   # 数据库模型
├── utils/                          # 工具函数
│   ├── cache.py                      # 缓存工具
│   └── helpers.py                    # 辅助函数
└── logs/                           # 日志目录
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 进入项目目录
cd python-analysis-service

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件，设置数据库和API密钥
# 主要配置项：
# - DATABASE_URL: MySQL数据库连接
# - DASHSCOPE_API_KEY: 通义千问API密钥
# - REDIS_URL: Redis缓存连接
```

### 4. 启动服务

```bash
# 直接启动
python main.py
```

### 5. 访问服务

- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health
- **股票推荐API**: http://localhost:8000/api/v1/stock-recommendation/

## 📚 API接口

### 1. 关键词分析

**POST** `/api/v1/stock-recommendation/analyze-keywords`

分析用户查询文本，提取投资相关关键词。

```json
{
  "query": "推荐一些银行股",
  "max_keywords": 20
}
```

### 2. 股票推荐

**POST** `/api/v1/stock-recommendation/recommend`

基于关键词分析推荐相关股票。

```json
{
  "query": "高ROE的科技股",
  "limit": 10,
  "min_market_cap": 100,
  "max_pe_ratio": 30,
  "min_roe": 15
}
```

### 3. 股票搜索

**GET** `/api/v1/stock-recommendation/search?q=银行股&limit=5`

简化的股票搜索接口。

### 4. 健康检查

**GET** `/api/v1/stock-recommendation/health`

检查服务状态。

详细的API使用说明请参考 [API_USAGE_GUIDE.md](API_USAGE_GUIDE.md)

## 🎯 使用示例

### Python示例

```python
import requests

# 股票推荐
response = requests.post("http://localhost:8000/api/v1/stock-recommendation/recommend", 
                        json={"query": "推荐一些新能源汽车股", "limit": 5})
result = response.json()

for stock in result["data"]["recommendations"]:
    print(f"{stock['symbol']} - {stock['name']} (匹配度: {stock['match_score']:.2f})")
```

### 查询示例

- "推荐一些银行股"
- "高ROE的科技股"
- "新能源汽车概念股"
- "低PE高分红的价值股"
- "ChatGPT概念股有哪些"

## ⚙️ 配置说明

### 环境变量配置

```bash
# 服务配置
HOST=0.0.0.0
PORT=8000
DEBUG=True

# 数据库配置 - MySQL
DATABASE_URL=mysql+pymysql://root:password@localhost:3366/chaogu
DB_HOST=localhost
DB_PORT=3366
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=chaogu

# 通义千问API配置
DASHSCOPE_API_KEY=your_dashscope_api_key
QWEN_MODEL=qwen-plus
QWEN_MAX_TOKENS=1000
QWEN_TEMPERATURE=0.3

# 缓存配置
REDIS_URL=redis://localhost:6379/0
CACHE_SIZE=1000

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/analysis_service.log
```

### 数据库表结构

系统依赖以下MySQL数据库表：

- `stock_info`: 股票基本信息（代码、名称、市值、PE/PB等）
- `stock_data`: 股票交易数据（OHLC、成交量、涨跌幅等）
- `stock_financial`: 财务数据（营收、净利润、ROE等）
- `stock_dividend`: 分红数据（分红金额、股息率等）

## 🧪 测试

### 运行API测试

```bash
# 确保服务已启动
python main.py

# 在另一个终端运行测试
python test_recommendation_api.py
```

### 测试内容

- 健康检查测试
- 关键词分析测试
- 股票推荐测试
- 股票搜索测试
- 错误处理测试

## 🐳 Docker部署

### 1. Docker构建

```bash
# 构建镜像
docker build -t stock-recommendation-api .

# 运行容器
docker run -p 8000:8000 stock-recommendation-api
```

### 2. Docker Compose部署

```bash
# 启动所有服务（包括Redis）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🔧 核心服务说明

### KeywordAnalyzer (关键词分析器)

- 使用通义千问AI进行智能关键词提取
- 结合规则引擎进行关键词分类
- 支持行业、概念、财务、技术指标分类
- 情感分析和查询意图识别

### StockRecommender (股票推荐器)

- 基于关键词分析结果查询数据库
- 多维度匹配评分算法
- 风险等级自动评估
- 财务亮点提取

## 📈 性能优化

- **缓存策略**: 关键词分析结果缓存1小时，推荐结果缓存30分钟
- **数据库优化**: 索引优化，分页查询
- **异步处理**: FastAPI异步特性
- **连接池**: 数据库连接池管理

## 🔒 安全考虑

- API访问频率限制
- 输入参数验证
- SQL注入防护
- 敏感信息脱敏

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务状态
   - 验证数据库配置信息
   - 确认网络连接

2. **通义千问API调用失败**
   - 检查API密钥配置
   - 确认网络连接
   - 查看API配额

3. **Redis连接问题**
   - 检查Redis服务状态
   - 验证连接配置

### 日志查看

```bash
# 查看服务日志
tail -f logs/analysis_service.log

# 查看错误日志
grep ERROR logs/analysis_service.log
```

## 📊 监控指标

- API响应时间
- 请求成功率
- 缓存命中率
- 数据库查询性能
- AI分析准确率

## 🔄 版本更新

### v1.0.0 (当前版本)
- ✅ 基础股票推荐功能
- ✅ 通义千问AI集成
- ✅ MySQL数据库支持
- ✅ Redis缓存支持
- ✅ 完整API文档

### 计划功能
- 🔄 实时股票数据接入
- 🔄 更多技术指标支持
- 🔄 用户偏好学习
- 🔄 投资组合优化

## 📞 技术支持

如有问题，请：
1. 查看 [API_USAGE_GUIDE.md](API_USAGE_GUIDE.md) 详细文档
2. 运行测试脚本诊断问题
3. 查看日志文件排查错误
4. 联系开发团队

---

**项目版本**: v1.0.0  
**最后更新**: 2025年7月22日  
**维护团队**: ChaoGu Development Team
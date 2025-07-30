# 数据迁移脚本说明

## 回测策略股票数据迁移

### 问题描述
现有的回测策略可能缺少股票配置数据，导致在配置页面无法显示股票列表。

### 解决方案
运行迁移脚本为所有缺少股票数据的回测策略添加默认股票配置。

### 使用方法

#### 1. 简化版迁移脚本（推荐）
```bash
cd backend
npm run migrate:backtest-stocks
```

#### 2. 手动运行脚本
```bash
cd backend
node scripts/migrate-backtest-stocks-simple.js
```

### 脚本功能
- 查找所有没有股票数据的回测策略
- 为每个策略添加4只默认股票：
  - AAPL (苹果公司) - 25%
  - MSFT (微软公司) - 25%
  - GOOGL (谷歌) - 25%
  - TSLA (特斯拉) - 25%
- 如果股票不存在，会自动创建股票基础信息
- 使用事务确保数据完整性

### 注意事项
1. 请确保数据库连接配置正确
2. 建议在测试环境先运行验证
3. 脚本支持重复运行，已有数据的策略会被跳过
4. 运行前请备份数据库

### 环境变量
确保以下环境变量正确配置：
- `DB_HOST`: 数据库主机地址
- `DB_PORT`: 数据库端口
- `DB_USERNAME`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_DATABASE`: 数据库名称

### 运行结果
脚本运行成功后，所有回测策略都将有默认的股票配置，用户可以在配置页面看到并修改这些股票。 

# 数据库重复键值修复工具

## 问题描述

后端项目启动时出现重复键值错误：
```
[Nest] 19916  - 2025/07/19 11:12:12   ERROR [ExceptionHandler] Duplicate entry '920167' for key 'IDX_a991a819334946a58095394e7f'
QueryFailedError: Duplicate entry '920167' for key 'IDX_a991a819334946a58095394e7f'
```

## 问题原因

数据库中的股票相关表存在重复记录，违反了唯一约束，主要涉及以下表：
- `stock_f10` - 股票基本信息表（symbol字段重复）
- `stock_data` - 股票交易数据表（symbol+date组合重复）
- `stock_financial` - 财务数据表（symbol+reportDate组合重复）
- `stock_dividend` - 分红数据表（symbol+recordDate组合重复）

## 解决方案

### 方案1：使用自动修复脚本（推荐）

运行通用修复脚本清理所有重复数据：

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install mysql2

# 执行修复脚本
node scripts/fix-all-duplicate-keys.js
```

### 方案2：手动执行SQL修复

如果需要手动修复，可以执行以下迁移：

```bash
# 执行特定迁移
node -e "
const mysql = require('mysql2/promise');
const fs = require('fs');
async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'chaogu'
  });
  const sql = fs.readFileSync('src/migrations/012-fix-duplicate-stock-f10-symbol.sql', 'utf8');
  await conn.execute(sql);
  await conn.end();
}
run();
"
```

## 修复内容

### 1. stock_f10表修复
- 删除重复的symbol记录
- 保留每个symbol的最新记录（基于updatedAt）

### 2. stock_data表修复  
- 删除重复的(symbol, date)组合
- 保留最新的交易数据

### 3. stock_financial表修复
- 删除重复的(symbol, reportDate)组合
- 保留最新的财务数据

### 4. stock_dividend表修复
- 删除重复的(symbol, recordDate)组合
- 保留最新的分红数据

## 验证修复结果

修复完成后，脚本会自动验证是否还有重复记录：

```sql
-- 检查stock_f10表
SELECT symbol, COUNT(*) as count FROM stock_f10 GROUP BY symbol HAVING COUNT(*) > 1;

-- 检查stock_data表  
SELECT symbol, date, COUNT(*) as count FROM stock_data GROUP BY symbol, date HAVING COUNT(*) > 1;

-- 检查stock_financial表
SELECT symbol, reportDate, COUNT(*) as count FROM stock_financial GROUP BY symbol, reportDate HAVING COUNT(*) > 1;

-- 检查stock_dividend表
SELECT symbol, recordDate, COUNT(*) as count FROM stock_dividend GROUP BY symbol, recordDate HAVING COUNT(*) > 1;
```

## 预防措施

为了避免将来出现重复键问题，爬虫代码已经使用 `ON DUPLICATE KEY UPDATE` 语法：

```sql
INSERT INTO stock_f10 (...) VALUES (...) 
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  updatedAt = CURRENT_TIMESTAMP;
```

## 环境变量配置

确保正确配置数据库连接信息：

```bash
# .env文件
DB_HOST=localhost
DB_PORT=3306  
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=chaogu
```

## 注意事项

1. **备份数据**：执行修复前建议备份数据库
2. **停止服务**：修复期间停止后端服务和爬虫
3. **权限检查**：确保数据库用户有DELETE权限
4. **网络连接**：确保数据库连接稳定

## 故障排除

### 连接失败
- 检查数据库服务是否运行
- 验证连接参数是否正确
- 确认用户权限

### 权限不足
```sql
GRANT DELETE ON chaogu.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### 修复失败
如果自动修复失败，可以手动执行SQL语句进行修复。 
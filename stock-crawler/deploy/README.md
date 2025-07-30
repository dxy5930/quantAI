# Stock Crawler 服务器部署指南

本指南提供了多种部署Stock Crawler到生产服务器的方案。

## 快速开始

```bash
# 下载项目
git clone <your-repo-url>
cd stock-crawler/deploy

# 给脚本执行权限
chmod +x quick-deploy.sh install.sh

# 选择部署方式（推荐systemd）
sudo ./quick-deploy.sh systemd
```

## 部署方式对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **systemd** | 系统集成好，自动重启，日志管理 | 需要root权限 | 生产环境推荐 |
| **docker** | 环境隔离，易于迁移，包含数据库 | 资源占用较高 | 容器化环境 |
| **cron** | 简单轻量，用户级部署 | 无服务管理，错误处理弱 | 个人使用 |
| **manual** | 完全控制，灵活配置 | 需要手动管理 | 开发测试 |

## 详细部署步骤

### 1. Systemd 部署（推荐）

适用于生产环境，提供完整的服务管理功能。

```bash
# 1. 运行安装脚本
sudo bash install.sh

# 2. 编辑配置文件
sudo nano /opt/stock-crawler/.env

# 3. 测试数据库连接
stock-crawler test-db

# 4. 运行一次测试
stock-crawler run-once

# 5. 启动服务
stock-crawler start

# 6. 查看状态
stock-crawler status
```

**服务管理命令：**
```bash
stock-crawler start      # 启动服务
stock-crawler stop       # 停止服务
stock-crawler restart    # 重启服务
stock-crawler status     # 查看状态
stock-crawler logs       # 查看日志
stock-crawler run-once   # 手动运行一次
stock-crawler test-db    # 测试数据库连接
```

**定时任务：**
- 每天凌晨1点：完整数据同步
- 每天9:30和15:30：交易数据更新（工作日）
- 每周日凌晨2点：数据清理
- 每月1号：完整数据补充

### 2. Docker 部署

适用于容器化环境，包含MySQL数据库。

```bash
cd docker

# 1. 复制并编辑环境变量
cp .env.example .env
nano .env

# 2. 启动服务
docker-compose up -d --build

# 3. 查看日志
docker-compose logs -f stock-crawler

# 4. 可选：启动监控服务
docker-compose --profile monitoring up -d
```

**Docker管理命令：**
```bash
docker-compose up -d          # 启动服务
docker-compose down           # 停止服务
docker-compose logs -f        # 查看日志
docker-compose ps             # 查看状态
docker-compose restart        # 重启服务
```

**访问地址：**
- MySQL: `localhost:3306`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

### 3. Cron 部署

适用于个人使用，简单轻量。

```bash
# 1. 运行部署脚本
./quick-deploy.sh cron

# 2. 编辑配置文件
nano ~/stock-crawler/.env

# 3. 测试运行
cd ~/stock-crawler
source venv/bin/activate
python main.py --mode test

# 4. 查看cron任务
crontab -l
```

### 4. 手动部署

适用于开发测试环境。

```bash
# 1. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
nano .env

# 4. 测试运行
python main.py --mode test
python daily_sync.py --mode once
```

## 配置说明

### 环境变量配置 (.env)

```bash
# 数据库配置
DB_HOST=localhost          # 数据库主机
DB_PORT=3306              # 数据库端口
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password # 数据库密码
DB_NAME=chaogu           # 数据库名称

# 爬取配置
CRAWL_DELAY=0.5          # 请求间隔（秒）
BATCH_SIZE=100           # 批处理大小
MAX_RETRIES=3            # 最大重试次数

# 日志配置
LOG_LEVEL=INFO           # 日志级别
LOG_FILE=logs/crawler.log # 日志文件路径
```

### 数据库配置

确保MySQL数据库已创建并配置正确的权限：

```sql
-- 创建数据库
CREATE DATABASE chaogu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'stockuser'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON chaogu.* TO 'stockuser'@'%';
FLUSH PRIVILEGES;
```

## 监控和维护

### 日志管理

**Systemd部署：**
```bash
# 查看服务日志
journalctl -u stock-crawler -f

# 查看应用日志
tail -f /opt/stock-crawler/logs/crawler.log

# 日志轮转配置
cat /etc/logrotate.d/stock-crawler
```

**Docker部署：**
```bash
# 查看容器日志
docker-compose logs -f stock-crawler

# 进入容器查看文件日志
docker-compose exec stock-crawler tail -f logs/crawler.log
```

### 健康检查

```bash
# Systemd
stock-crawler status

# Docker
docker-compose ps
python monitor.py  # 在容器内运行

# 手动检查
python -c "from database import db_manager; print('OK' if db_manager.test_connection() else 'FAIL')"
```

### 性能优化

1. **调整爬取参数：**
   ```bash
   # 减少延迟提高速度（注意不要被限制）
   CRAWL_DELAY=0.3
   BATCH_SIZE=200
   ```

2. **数据库优化：**
   ```sql
   -- 添加索引
   ALTER TABLE stock_data ADD INDEX idx_symbol_date (symbol, date);
   ALTER TABLE stock_financial ADD INDEX idx_symbol_report (symbol, reportDate);
   ```

3. **系统资源：**
   ```bash
   # 监控资源使用
   htop
   iotop
   
   # 调整服务资源限制（systemd）
   sudo systemctl edit stock-crawler
   ```

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库服务
   systemctl status mysql
   
   # 检查网络连接
   telnet localhost 3306
   
   # 检查配置文件
   cat .env
   ```

2. **爬取失败率高**
   ```bash
   # 增加延迟时间
   CRAWL_DELAY=2.0
   
   # 检查网络连接
   ping baidu.com
   
   # 更新akshare
   pip install akshare --upgrade
   ```

3. **服务无法启动**
   ```bash
   # 查看详细错误
   journalctl -u stock-crawler -n 50
   
   # 检查权限
   ls -la /opt/stock-crawler
   
   # 手动测试
   sudo -u stockcrawler /opt/stock-crawler/venv/bin/python /opt/stock-crawler/main.py --mode test
   ```

### 备份和恢复

```bash
# 数据库备份
mysqldump -u root -p chaogu > backup_$(date +%Y%m%d).sql

# 配置文件备份
tar -czf config_backup.tar.gz .env logs/

# 恢复数据库
mysql -u root -p chaogu < backup_20240101.sql
```

## 升级指南

```bash
# 1. 停止服务
stock-crawler stop  # 或 docker-compose down

# 2. 备份数据
mysqldump -u root -p chaogu > backup_before_upgrade.sql

# 3. 更新代码
git pull origin main

# 4. 更新依赖
source venv/bin/activate
pip install -r requirements.txt --upgrade

# 5. 重启服务
stock-crawler start  # 或 docker-compose up -d
```

## 安全建议

1. **数据库安全：**
   - 使用强密码
   - 限制数据库访问IP
   - 定期备份数据

2. **系统安全：**
   - 定期更新系统
   - 配置防火墙
   - 使用非root用户运行服务

3. **网络安全：**
   - 使用HTTPS代理（如需要）
   - 限制出站网络访问
   - 监控异常流量

## 联系支持

如果遇到问题，请提供以下信息：
- 部署方式和操作系统
- 错误日志
- 配置文件（隐藏敏感信息）
- 系统资源使用情况
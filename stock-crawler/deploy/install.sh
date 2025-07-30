#!/bin/bash

# Stock Crawler 服务器部署脚本
# 使用方法: sudo bash install.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
if [[ $EUID -ne 0 ]]; then
   log_error "此脚本需要root权限运行"
   exit 1
fi

# 配置变量
INSTALL_DIR="/opt/stock-crawler"
SERVICE_USER="stockcrawler"
SERVICE_GROUP="stockcrawler"
PYTHON_VERSION="3.9"

log_info "开始部署Stock Crawler服务..."

# 1. 创建服务用户
log_info "创建服务用户..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $INSTALL_DIR -m $SERVICE_USER
    log_info "用户 $SERVICE_USER 创建成功"
else
    log_warn "用户 $SERVICE_USER 已存在"
fi

# 2. 安装系统依赖
log_info "安装系统依赖..."
if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y python3 python3-pip python3-venv python3-dev \
                       mysql-client libmysqlclient-dev \
                       build-essential curl wget git \
                       supervisor cron logrotate
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum update -y
    yum install -y python3 python3-pip python3-devel \
                   mysql-devel gcc gcc-c++ \
                   curl wget git \
                   supervisor cronie logrotate
else
    log_error "不支持的操作系统"
    exit 1
fi

# 3. 创建安装目录
log_info "创建安装目录..."
mkdir -p $INSTALL_DIR/{logs,data,config}
chown -R $SERVICE_USER:$SERVICE_GROUP $INSTALL_DIR

# 4. 复制项目文件
log_info "复制项目文件..."
# 假设当前目录是stock-crawler
cp -r ../* $INSTALL_DIR/
chown -R $SERVICE_USER:$SERVICE_GROUP $INSTALL_DIR

# 5. 创建Python虚拟环境
log_info "创建Python虚拟环境..."
sudo -u $SERVICE_USER python3 -m venv $INSTALL_DIR/venv
sudo -u $SERVICE_USER $INSTALL_DIR/venv/bin/pip install --upgrade pip

# 6. 安装Python依赖
log_info "安装Python依赖..."
cat > $INSTALL_DIR/requirements.txt << EOF
akshare>=1.12.0
pandas>=1.5.0
pymysql>=1.0.0
python-dotenv>=1.0.0
loguru>=0.7.0
schedule>=1.2.0
requests>=2.28.0
numpy>=1.24.0
lxml>=4.9.0
beautifulsoup4>=4.11.0
openpyxl>=3.1.0
EOF

sudo -u $SERVICE_USER $INSTALL_DIR/venv/bin/pip install -r $INSTALL_DIR/requirements.txt

# 7. 配置环境变量
log_info "配置环境变量..."
if [ ! -f "$INSTALL_DIR/.env" ]; then
    cat > $INSTALL_DIR/.env << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chaogu

# 爬取配置
CRAWL_DELAY=0.5
BATCH_SIZE=100
MAX_RETRIES=3

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/crawler.log
EOF
    chown $SERVICE_USER:$SERVICE_GROUP $INSTALL_DIR/.env
    log_warn "请编辑 $INSTALL_DIR/.env 文件配置数据库连接信息"
fi

# 8. 设置日志轮转
log_info "配置日志轮转..."
cat > /etc/logrotate.d/stock-crawler << EOF
$INSTALL_DIR/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $SERVICE_USER $SERVICE_GROUP
    postrotate
        systemctl reload stock-crawler || true
    endscript
}
EOF

# 9. 安装systemd服务
log_info "安装systemd服务..."
cp systemd/stock-crawler.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable stock-crawler

# 10. 配置cron任务
log_info "配置cron任务..."
sudo -u $SERVICE_USER crontab crontab/stock-crawler-cron

# 11. 创建管理脚本
log_info "创建管理脚本..."
cat > /usr/local/bin/stock-crawler << 'EOF'
#!/bin/bash

INSTALL_DIR="/opt/stock-crawler"
SERVICE_USER="stockcrawler"

case "$1" in
    start)
        systemctl start stock-crawler
        echo "Stock Crawler服务已启动"
        ;;
    stop)
        systemctl stop stock-crawler
        echo "Stock Crawler服务已停止"
        ;;
    restart)
        systemctl restart stock-crawler
        echo "Stock Crawler服务已重启"
        ;;
    status)
        systemctl status stock-crawler
        ;;
    logs)
        journalctl -u stock-crawler -f
        ;;
    run-once)
        sudo -u $SERVICE_USER $INSTALL_DIR/venv/bin/python $INSTALL_DIR/daily_sync.py --mode once
        ;;
    test-db)
        sudo -u $SERVICE_USER $INSTALL_DIR/venv/bin/python $INSTALL_DIR/main.py --mode test
        ;;
    *)
        echo "使用方法: $0 {start|stop|restart|status|logs|run-once|test-db}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/stock-crawler

# 12. 设置防火墙（如果需要）
if command -v ufw &> /dev/null; then
    log_info "配置防火墙..."
    # 如果需要开放端口，在这里添加
fi

# 13. 创建监控脚本
log_info "创建监控脚本..."
cat > $INSTALL_DIR/monitor.py << 'EOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.dirname(__file__))

from database import db_manager
from datetime import datetime, timedelta
import json

def check_service_health():
    """检查服务健康状态"""
    health_status = {
        'timestamp': datetime.now().isoformat(),
        'database': False,
        'data_freshness': False,
        'error_rate': 0,
        'status': 'unhealthy'
    }
    
    try:
        # 检查数据库连接
        if db_manager.test_connection():
            health_status['database'] = True
            
            # 检查数据新鲜度（今日是否有数据）
            conn = db_manager.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM stock_data WHERE date = CURDATE()")
                today_count = cursor.fetchone()[0]
                
                if today_count > 0:
                    health_status['data_freshness'] = True
                
                # 检查错误率（最近24小时的日志）
                # 这里可以添加日志分析逻辑
                
            conn.close()
        
        # 综合判断健康状态
        if health_status['database'] and health_status['data_freshness']:
            health_status['status'] = 'healthy'
        elif health_status['database']:
            health_status['status'] = 'warning'
        
    except Exception as e:
        health_status['error'] = str(e)
    
    return health_status

if __name__ == '__main__':
    health = check_service_health()
    print(json.dumps(health, indent=2))
    
    # 返回适当的退出码
    if health['status'] == 'healthy':
        sys.exit(0)
    elif health['status'] == 'warning':
        sys.exit(1)
    else:
        sys.exit(2)
EOF

chmod +x $INSTALL_DIR/monitor.py
chown $SERVICE_USER:$SERVICE_GROUP $INSTALL_DIR/monitor.py

log_info "部署完成！"
log_info ""
log_info "接下来的步骤："
log_info "1. 编辑配置文件: $INSTALL_DIR/.env"
log_info "2. 测试数据库连接: stock-crawler test-db"
log_info "3. 运行一次同步测试: stock-crawler run-once"
log_info "4. 启动服务: stock-crawler start"
log_info "5. 查看服务状态: stock-crawler status"
log_info "6. 查看日志: stock-crawler logs"
log_info ""
log_info "管理命令:"
log_info "  stock-crawler {start|stop|restart|status|logs|run-once|test-db}"
log_info ""
log_info "服务将在每天凌晨1点自动运行数据同步任务"
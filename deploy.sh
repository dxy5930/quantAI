#!/bin/bash

# FindValue 项目宝塔部署脚本
# 域名: www.inhandle.com

echo "开始部署 FindValue 项目..."

# 设置变量
PROJECT_ROOT="/www/wwwroot/www.inhandle.com"
BACKUP_DIR="/www/backup/findvalue"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 1. 停止现有服务
echo "停止现有服务..."
pm2 stop all
pm2 delete all

# 2. 备份现有项目（如果存在）
if [ -d "$PROJECT_ROOT" ]; then
    echo "备份现有项目..."
    tar -czf "$BACKUP_DIR/findvalue_backup_$DATE.tar.gz" -C "$PROJECT_ROOT" .
fi

# 3. 创建项目目录
mkdir -p $PROJECT_ROOT
cd $PROJECT_ROOT

# 4. 克隆项目代码
echo "克隆项目代码..."
git clone https://github.com/dxy5930/quantAI.git .

# 5. 安装 Node.js 依赖并构建后端
echo "构建后端项目..."
cd backend
npm install --production
npm run build
cd ..

# 6. 安装 Node.js 依赖并构建前端
echo "构建前端项目..."
cd project
npm install
npm run build:prod
cd ..

# 7. 安装 Python 依赖
echo "安装 Python 分析服务依赖..."
cd python-analysis-service
pip3 install -r requirements.txt
cd ..

echo "安装股票爬虫依赖..."
cd stock-crawler
pip3 install -r requirements.txt
cd ..

# 8. 创建日志目录
echo "创建日志目录..."
mkdir -p backend/logs
mkdir -p python-analysis-service/logs
mkdir -p stock-crawler/logs

# 9. 设置权限
echo "设置文件权限..."
chown -R www:www $PROJECT_ROOT
chmod -R 755 $PROJECT_ROOT

# 10. 启动服务
echo "启动服务..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "部署完成！"
echo "前端访问地址: https://www.inhandle.com"
echo "后端API地址: https://www.inhandle.com/api/v1"
echo "Python服务端口: 8000"

# 11. 显示服务状态
pm2 status
#!/bin/bash

# 部署脚本 - 支持多环境部署
# 用法: ./deploy.sh [环境] [域名]
# 示例: ./deploy.sh production https://your-domain.com

ENV=${1:-development}
FRONTEND_URL=${2}

echo "=== 开始部署 ChaoGu 量化平台 ==="
echo "环境: $ENV"
echo "前端域名: $FRONTEND_URL"

# 检查参数
if [ -z "$FRONTEND_URL" ]; then
    echo "错误: 请提供前端域名"
    echo "用法: ./deploy.sh [环境] [域名]"
    echo "示例: ./deploy.sh production https://your-domain.com"
    exit 1
fi

# 设置环境变量
export NODE_ENV=$ENV
export FRONTEND_URL=$FRONTEND_URL

# 根据环境设置不同的配置
case $ENV in
    "production")
        echo "配置生产环境..."
        export ALLOWED_DOMAINS="$FRONTEND_URL,https://www.${FRONTEND_URL#https://}"
        export JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
        ;;
    "staging")
        echo "配置测试环境..."
        export ALLOWED_DOMAINS="$FRONTEND_URL,https://test.${FRONTEND_URL#https://}"
        ;;
    "development")
        echo "配置开发环境..."
        export ALLOWED_DOMAINS="http://localhost:3000,http://localhost:5173,http://localhost:5174,$FRONTEND_URL"
        ;;
    *)
        echo "未知环境: $ENV"
        exit 1
        ;;
esac

echo "=== 环境配置 ==="
echo "NODE_ENV: $NODE_ENV"
echo "FRONTEND_URL: $FRONTEND_URL"
echo "ALLOWED_DOMAINS: $ALLOWED_DOMAINS"

# 构建应用
echo "=== 构建应用 ==="
npm ci
npm run build

# 运行数据库迁移
echo "=== 运行数据库迁移 ==="
npm run migration:run

# 启动应用
echo "=== 启动应用 ==="
if [ "$ENV" = "production" ]; then
    # 生产环境使用PM2
    npm install -g pm2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
else
    # 其他环境直接启动
    npm run start:prod
fi

echo "=== 部署完成 ==="
echo "应用已启动，前端URL: $FRONTEND_URL" 
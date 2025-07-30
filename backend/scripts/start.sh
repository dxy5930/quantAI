#!/bin/bash

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  环境变量文件 .env 不存在，请先复制 .env.example 并配置"
    echo "   cp .env.example .env"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "⚠️  Node.js版本过低，请升级到 18.x 或更高版本"
    echo "   当前版本: $NODE_VERSION"
    echo "   要求版本: $REQUIRED_VERSION+"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 启动应用
echo "🚀 启动超股量化交易策略平台后端服务..."
echo "📚 API文档将在 http://localhost:3001/api/docs 提供"
echo "🔧 开发模式启动中..."

npm run start:dev 
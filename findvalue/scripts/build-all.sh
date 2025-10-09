#!/bin/bash

# 构建所有环境的脚本
# 使用方法: ./scripts/build-all.sh [android|ios|all]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
PLATFORM=${1:-all}

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "all" ]]; then
    log_error "无效的平台参数: $PLATFORM"
    log_info "使用方法: $0 [android|ios|all]"
    exit 1
fi

log_info "开始构建 $PLATFORM 平台的所有环境..."

# 清理之前的构建
log_info "清理之前的构建..."
npm run clean

# 构建函数
build_android() {
    log_info "构建 Android 应用..."
    
    log_info "构建开发环境..."
    npm run build:android:dev
    log_success "Android 开发环境构建完成"
    
    log_info "构建测试环境..."
    npm run build:android:test
    log_success "Android 测试环境构建完成"
    
    log_info "构建预发布环境..."
    npm run build:android:staging
    log_success "Android 预发布环境构建完成"
    
    log_info "构建生产环境..."
    npm run build:android:prod
    log_success "Android 生产环境构建完成"
}

build_ios() {
    log_info "构建 iOS 应用..."
    
    log_info "构建开发环境..."
    npm run build:ios:dev
    log_success "iOS 开发环境构建完成"
    
    log_info "构建测试环境..."
    npm run build:ios:test
    log_success "iOS 测试环境构建完成"
    
    log_info "构建预发布环境..."
    npm run build:ios:staging
    log_success "iOS 预发布环境构建完成"
    
    log_info "构建生产环境..."
    npm run build:ios:prod
    log_success "iOS 生产环境构建完成"
}

# 执行构建
case $PLATFORM in
    "android")
        build_android
        ;;
    "ios")
        build_ios
        ;;
    "all")
        build_android
        build_ios
        ;;
esac

log_success "所有构建完成！"

# 显示构建结果
log_info "构建结果:"
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
    log_info "Android APK 位置:"
    find android/app/build/outputs/apk -name "*.apk" -type f | while read file; do
        log_info "  - $file"
    done
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
    log_info "iOS 构建位置:"
    find ios/build -name "*.app" -type d | while read dir; do
        log_info "  - $dir"
    done
fi

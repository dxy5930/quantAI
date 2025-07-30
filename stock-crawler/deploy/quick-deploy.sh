#!/bin/bash

# Stock Crawler 快速部署脚本
# 支持多种部署方式：systemd, docker, cron

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_blue() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }

# 显示帮助信息
show_help() {
    cat << EOF
Stock Crawler 快速部署脚本

使用方法:
    $0 [选项] <部署方式>

部署方式:
    systemd     - 使用systemd服务部署（推荐用于生产环境）
    docker      - 使用Docker容器部署
    cron        - 仅使用cron定时任务部署
    manual      - 手动部署，仅安装依赖

选项:
    -h, --help      显示此帮助信息
    -v, --verbose   详细输出
    --dry-run       仅显示将要执行的操作，不实际执行

示例:
    $0 systemd              # 使用systemd部署
    $0 docker               # 使用Docker部署
    $0 cron                 # 使用cron部署
    $0 --dry-run systemd    # 预览systemd部署步骤

EOF
}

# 检查系统环境
check_system() {
    log_info "检查系统环境..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            OS_TYPE="debian"
            log_info "检测到Debian/Ubuntu系统"
        elif command -v yum &> /dev/null; then
            OS_TYPE="redhat"
            log_info "检测到RedHat/CentOS系统"
        else
            log_error "不支持的Linux发行版"
            exit 1
        fi
    else
        log_error "仅支持Linux系统"
        exit 1
    fi
    
    # 检查权限
    if [[ $EUID -ne 0 ]] && [[ "$DEPLOY_METHOD" != "manual" ]]; then
        log_error "需要root权限运行此脚本"
        exit 1
    fi
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_warn "未找到Python3，将自动安装"
        NEED_PYTHON=true
    else
        log_info "Python3已安装: $(python3 --version)"
    fi
    
    # 检查Docker（如果需要）
    if [[ "$DEPLOY_METHOD" == "docker" ]]; then
        if ! command -v docker &> /dev/null; then
            log_warn "未找到Docker，将自动安装"
            NEED_DOCKER=true
        fi
        if ! command -v docker-compose &> /dev/null; then
            log_warn "未找到Docker Compose，将自动安装"
            NEED_DOCKER_COMPOSE=true
        fi
    fi
}

# 安装系统依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_blue "[DRY RUN] 将安装系统依赖包"
        return
    fi
    
    if [[ "$OS_TYPE" == "debian" ]]; then
        apt-get update
        apt-get install -y python3 python3-pip python3-venv python3-dev \
                           mysql-client libmysqlclient-dev \
                           build-essential curl wget git \
                           supervisor cron logrotate
    elif [[ "$OS_TYPE" == "redhat" ]]; then
        yum update -y
        yum install -y python3 python3-pip python3-devel \
                       mysql-devel gcc gcc-c++ \
                       curl wget git \
                       supervisor cronie logrotate
    fi
    
    # 安装Docker（如果需要）
    if [[ "$NEED_DOCKER" == "true" ]]; then
        log_info "安装Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
        rm get-docker.sh
    fi
    
    if [[ "$NEED_DOCKER_COMPOSE" == "true" ]]; then
        log_info "安装Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
}

# Systemd部署
deploy_systemd() {
    log_info "使用systemd方式部署..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_blue "[DRY RUN] 将执行systemd部署"
        log_blue "  - 创建服务用户"
        log_blue "  - 安装到/opt/stock-crawler"
        log_blue "  - 创建systemd服务"
        log_blue "  - 配置cron任务"
        return
    fi
    
    bash install.sh
}

# Docker部署
deploy_docker() {
    log_info "使用Docker方式部署..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_blue "[DRY RUN] 将执行Docker部署"
        log_blue "  - 构建Docker镜像"
        log_blue "  - 启动Docker Compose服务"
        log_blue "  - 配置数据库"
        return
    fi
    
    cd docker
    
    # 复制环境变量文件
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        log_warn "请编辑 docker/.env 文件配置密码"
        read -p "按回车键继续..."
    fi
    
    # 构建并启动服务
    docker-compose up -d --build
    
    log_info "Docker服务已启动"
    log_info "MySQL: localhost:3306"
    log_info "可选监控服务："
    log_info "  启动监控: docker-compose --profile monitoring up -d"
    log_info "  Prometheus: http://localhost:9090"
    log_info "  Grafana: http://localhost:3000"
}

# Cron部署
deploy_cron() {
    log_info "使用cron方式部署..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_blue "[DRY RUN] 将执行cron部署"
        log_blue "  - 安装到当前用户目录"
        log_blue "  - 配置cron任务"
        return
    fi
    
    # 创建安装目录
    INSTALL_DIR="$HOME/stock-crawler"
    mkdir -p $INSTALL_DIR/{logs,data}
    
    # 复制文件
    cp -r ../../* $INSTALL_DIR/
    cd $INSTALL_DIR
    
    # 创建虚拟环境
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # 配置环境变量
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        log_warn "请编辑 $INSTALL_DIR/.env 文件配置数据库连接"
    fi
    
    # 安装cron任务
    crontab crontab/stock-crawler-cron
    
    log_info "Cron任务已配置"
    log_info "安装目录: $INSTALL_DIR"
}

# 手动部署
deploy_manual() {
    log_info "手动部署模式..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_blue "[DRY RUN] 将执行手动部署"
        log_blue "  - 仅安装Python依赖"
        log_blue "  - 创建配置文件"
        return
    fi
    
    # 创建虚拟环境
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    
    # 安装依赖
    cat > requirements.txt << EOF
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
    
    pip install -r requirements.txt
    
    # 创建配置文件
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        log_warn "请编辑 .env 文件配置数据库连接"
    fi
    
    log_info "手动部署完成"
    log_info "激活虚拟环境: source venv/bin/activate"
    log_info "测试连接: python main.py --mode test"
    log_info "运行爬虫: python daily_sync.py --mode once"
}

# 主函数
main() {
    # 解析参数
    DEPLOY_METHOD=""
    DRY_RUN=false
    VERBOSE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            systemd|docker|cron|manual)
                DEPLOY_METHOD=$1
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [[ -z "$DEPLOY_METHOD" ]]; then
        log_error "请指定部署方式"
        show_help
        exit 1
    fi
    
    log_info "Stock Crawler 快速部署脚本"
    log_info "部署方式: $DEPLOY_METHOD"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warn "DRY RUN模式 - 仅显示操作，不实际执行"
    fi
    
    # 检查系统环境
    check_system
    
    # 安装依赖
    if [[ "$DEPLOY_METHOD" != "manual" ]]; then
        install_dependencies
    fi
    
    # 执行部署
    case $DEPLOY_METHOD in
        systemd)
            deploy_systemd
            ;;
        docker)
            deploy_docker
            ;;
        cron)
            deploy_cron
            ;;
        manual)
            deploy_manual
            ;;
    esac
    
    log_info "部署完成！"
    
    # 显示后续步骤
    case $DEPLOY_METHOD in
        systemd)
            log_info "管理命令: stock-crawler {start|stop|restart|status|logs}"
            ;;
        docker)
            log_info "管理命令: docker-compose {up|down|logs|ps}"
            ;;
        cron)
            log_info "查看cron任务: crontab -l"
            ;;
        manual)
            log_info "手动运行: python daily_sync.py --mode once"
            ;;
    esac
}

# 运行主函数
main "$@"
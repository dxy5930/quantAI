#!/bin/bash

echo "股票数据爬虫系统"
echo "=================="

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 检查依赖是否安装
echo "检查依赖..."
if ! python3 -c "import akshare" &> /dev/null; then
    echo "安装依赖包..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "错误: 依赖安装失败"
        exit 1
    fi
fi

# 运行爬虫
echo "开始运行股票数据爬虫..."
python3 main.py --mode all

echo ""
echo "爬取完成"
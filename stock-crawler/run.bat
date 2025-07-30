@echo off
echo 股票数据爬虫系统
echo ==================

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Python，请先安装Python
    pause
    exit /b 1
)

REM 检查依赖是否安装
echo 检查依赖...
pip show akshare >nul 2>&1
if %errorlevel% neq 0 (
    echo 安装依赖包...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
)

REM 运行爬虫
echo 开始运行股票数据爬虫...
python main.py --mode all

echo.
echo 爬取完成，按任意键退出...
pause
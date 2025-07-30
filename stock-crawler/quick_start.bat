@echo off
chcp 65001 >nul
echo ========================================
echo 股票数据爬虫 - 快速启动
echo ========================================
echo.

echo 正在检查数据库连接...
python -c "from database import db_manager; print('✓ 数据库连接成功' if db_manager.test_connection() else '✗ 数据库连接失败')"

echo.
echo 正在查看当前数据进度...
python auto_batch_crawler.py --mode progress

echo.
echo ========================================
echo 推荐操作:
echo ========================================
echo 1. 处理缺失数据 (智能模式): python auto_batch_crawler.py --mode missing
echo 2. 继续全量处理: python auto_batch_crawler.py --mode all --start 150
echo 3. 小批次测试: python auto_batch_crawler.py --mode missing --batch 10 --max-batches 2
echo.

set /p action=是否立即开始处理缺失数据? (y/n): 
if /i "%action%"=="y" (
    echo.
    echo 开始处理缺失数据...
    python auto_batch_crawler.py --mode missing --batch 30
)

pause
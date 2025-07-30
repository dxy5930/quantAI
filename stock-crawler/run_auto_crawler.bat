@echo off
chcp 65001 >nul
echo ========================================
echo 股票数据自动批量爬虫
echo ========================================
echo.

:menu
echo 请选择运行模式:
echo 1. 只爬取缺失数据 (推荐)
echo 2. 全量数据爬取
echo 3. 查看当前数据统计
echo 4. 退出
echo.
set /p choice=请输入选择 (1-4): 

if "%choice%"=="1" goto missing
if "%choice%"=="2" goto all
if "%choice%"=="3" goto stats
if "%choice%"=="4" goto exit
echo 无效选择，请重新输入
goto menu

:missing
echo.
echo 开始爬取缺失数据...
echo 这将只处理没有F10、财务或分红数据的股票
echo.
python auto_batch_crawler.py --mode missing --batch-size 30 --delay 30
goto end

:all
echo.
echo 开始全量数据爬取...
echo 警告: 这将处理所有5000+只股票，可能需要数小时
echo.
set /p confirm=确认继续? (y/n): 
if /i "%confirm%"=="y" (
    python auto_batch_crawler.py --mode all --batch-size 50 --delay 60
) else (
    echo 已取消
    goto menu
)
goto end

:stats
echo.
echo 当前数据统计:
python -c "from database import db_manager; conn = db_manager.get_connection(); cursor = conn.cursor(); tables = ['stock_info', 'stock_data', 'stock_f10', 'stock_financial', 'stock_dividend']; [print(f'{table}: {cursor.execute(f\"SELECT COUNT(*) FROM {table}\") or cursor.fetchone()[0]}条') for table in tables]; cursor.execute('SELECT COUNT(DISTINCT symbol) FROM stock_f10'); f10_symbols = cursor.fetchone()[0]; cursor.execute('SELECT COUNT(DISTINCT symbol) FROM stock_financial'); fin_symbols = cursor.fetchone()[0]; cursor.execute('SELECT COUNT(DISTINCT symbol) FROM stock_dividend'); div_symbols = cursor.fetchone()[0]; print(f'\\n有F10数据的股票: {f10_symbols}只'); print(f'有财务数据的股票: {fin_symbols}只'); print(f'有分红数据的股票: {div_symbols}只'); conn.close()"
echo.
pause
goto menu

:end
echo.
echo 爬取任务完成!
echo 最终数据统计:
python -c "from database import db_manager; conn = db_manager.get_connection(); cursor = conn.cursor(); tables = ['stock_info', 'stock_data', 'stock_f10', 'stock_financial', 'stock_dividend']; [print(f'{table}: {cursor.execute(f\"SELECT COUNT(*) FROM {table}\") or cursor.fetchone()[0]}条') for table in tables]; cursor.execute('SELECT COUNT(DISTINCT symbol) FROM stock_f10'); f10_symbols = cursor.fetchone()[0]; cursor.execute('SELECT COUNT(DISTINCT symbol) FROM stock_financial'); fin_symbols = cursor.fetchone()[0]; cursor.execute('SELECT COUNT(DISTINCT symbol) FROM stock_dividend'); div_symbols = cursor.fetchone()[0]; print(f'\\n有F10数据的股票: {f10_symbols}只'); print(f'有财务数据的股票: {fin_symbols}只'); print(f'有分红数据的股票: {div_symbols}只'); conn.close()"
echo.
pause

:exit
echo 再见!
exit /b 0
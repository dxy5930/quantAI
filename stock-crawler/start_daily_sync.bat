@echo off
echo 启动股票数据每日同步服务...
echo.

cd /d "%~dp0"

echo 当前目录: %CD%
echo 时间: %DATE% %TIME%
echo.

echo 测试数据库连接...
python -c "from database import db_manager; print('数据库连接:', '成功' if db_manager.test_connection() else '失败')"

echo.
echo 启动定时任务调度器...
echo 每天凌晨1点自动执行股票数据同步
echo 按 Ctrl+C 停止服务
echo.

python daily_sync.py --mode schedule

pause
@echo off
echo 立即执行一次股票数据同步...
echo.

cd /d "%~dp0"

echo 当前目录: %CD%
echo 时间: %DATE% %TIME%
echo.

python daily_sync.py --mode once

echo.
echo 同步完成，按任意键退出...
pause
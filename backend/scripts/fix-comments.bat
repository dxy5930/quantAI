@echo off
echo 修复数据库表注释乱码问题...
echo.

cd /d "%~dp0"
node fix-table-comments.js

echo.
pause 
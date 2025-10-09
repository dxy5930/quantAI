@echo off
REM Android正式证书生成脚本 (Windows)
REM 使用方法: scripts\generate-keystore.bat

setlocal enabledelayedexpansion

echo [INFO] 开始生成Android正式证书...
echo.

REM 检查keytool是否可用
keytool -help >nul 2>&1
if errorlevel 1 (
    echo [ERROR] keytool命令不可用，请确保已安装Java JDK
    pause
    exit /b 1
)

set ANDROID_DIR=%~dp0..\android\app
set KEYSTORE_PATH=%ANDROID_DIR%\release.keystore

REM 检查证书是否已存在
if exist "%KEYSTORE_PATH%" (
    set /p OVERWRITE=证书文件已存在，是否覆盖？(y/N): 
    if /i not "!OVERWRITE!"=="y" if /i not "!OVERWRITE!"=="yes" (
        echo [INFO] 取消生成证书
        pause
        exit /b 0
    )
)

REM 获取用户输入
echo [INFO] 请输入证书信息:
set /p KEYSTORE_PASSWORD=证书密码 (至少6位): 
set /p KEY_ALIAS=密钥别名 (默认: findvalue): 
if "!KEY_ALIAS!"=="" set KEY_ALIAS=findvalue

set /p KEY_PASSWORD=密钥密码 (默认与证书密码相同): 
if "!KEY_PASSWORD!"=="" set KEY_PASSWORD=!KEYSTORE_PASSWORD!

set /p VALIDITY=证书有效期(年) (默认: 25): 
if "!VALIDITY!"=="" set VALIDITY=25

set /p DNAME=证书信息 (默认: CN=FindValue, OU=IT, O=FindValue, L=Beijing, ST=Beijing, C=CN): 
if "!DNAME!"=="" set DNAME=CN=FindValue, OU=IT, O=FindValue, L=Beijing, ST=Beijing, C=CN

REM 验证密码长度
if "!KEYSTORE_PASSWORD:~6!"=="" (
    echo [ERROR] 证书密码至少需要6位
    pause
    exit /b 1
)

echo.
echo [INFO] 正在生成证书...

REM 生成证书
keytool -genkey -v -keystore "%KEYSTORE_PATH%" -alias "%KEY_ALIAS%" -keyalg RSA -keysize 2048 -validity %VALIDITY% -dname "%DNAME%" -storepass "%KEYSTORE_PASSWORD%" -keypass "%KEY_PASSWORD%"

if errorlevel 1 (
    echo [ERROR] 证书生成失败
    pause
    exit /b 1
)

REM 创建证书信息文件
echo {> "%ANDROID_DIR%\keystore-info.json"
echo   "keystorePath": "android/app/release.keystore",>> "%ANDROID_DIR%\keystore-info.json"
echo   "keyAlias": "%KEY_ALIAS%",>> "%ANDROID_DIR%\keystore-info.json"
echo   "storePassword": "%KEYSTORE_PASSWORD%",>> "%ANDROID_DIR%\keystore-info.json"
echo   "keyPassword": "%KEY_PASSWORD%",>> "%ANDROID_DIR%\keystore-info.json"
echo   "generatedAt": "%date% %time%",>> "%ANDROID_DIR%\keystore-info.json"
echo   "validity": "%VALIDITY%年">> "%ANDROID_DIR%\keystore-info.json"
echo }>> "%ANDROID_DIR%\keystore-info.json"

echo.
echo [SUCCESS] 证书生成成功！
echo [INFO] 证书位置: %KEYSTORE_PATH%
echo [INFO] 证书信息: %ANDROID_DIR%\keystore-info.json
echo.
echo 证书信息:
echo   别名: %KEY_ALIAS%
echo   有效期: %VALIDITY%年
echo   算法: RSA 2048位
echo   位置: android/app/release.keystore
echo.
echo [WARNING] 重要安全提示:
echo 1. 请妥善保管证书文件和密码
echo 2. 不要将证书文件提交到版本控制系统
echo 3. 建议将证书信息存储在安全的密码管理器中
echo 4. 证书丢失将无法更新已发布的应用
echo.

REM 更新.gitignore
set GITIGNORE_PATH=%~dp0..\.gitignore
if exist "%GITIGNORE_PATH%" (
    findstr /C:"android/app/*.keystore" "%GITIGNORE_PATH%" >nul
    if errorlevel 1 (
        echo.>> "%GITIGNORE_PATH%"
        echo # Android keystore files>> "%GITIGNORE_PATH%"
        echo android/app/*.keystore>> "%GITIGNORE_PATH%"
        echo android/app/keystore-info.json>> "%GITIGNORE_PATH%"
        echo android/app/release.keystore>> "%GITIGNORE_PATH%"
        echo [INFO] 已更新.gitignore文件，排除证书文件
    )
)

echo.
echo 证书生成完成！
pause

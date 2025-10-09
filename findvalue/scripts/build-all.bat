@echo off
REM 构建所有环境的Windows批处理脚本
REM 使用方法: scripts\build-all.bat [android|ios|all]

setlocal enabledelayedexpansion

REM 检查参数
set PLATFORM=%1
if "%PLATFORM%"=="" set PLATFORM=all

if not "%PLATFORM%"=="android" if not "%PLATFORM%"=="ios" if not "%PLATFORM%"=="all" (
    echo [ERROR] 无效的平台参数: %PLATFORM%
    echo 使用方法: %0 [android^|ios^|all]
    exit /b 1
)

echo [INFO] 开始构建 %PLATFORM% 平台的所有环境...

REM 清理之前的构建
echo [INFO] 清理之前的构建...
call npm run clean

REM 构建函数
if "%PLATFORM%"=="android" goto :build_android
if "%PLATFORM%"=="ios" goto :build_ios
if "%PLATFORM%"=="all" goto :build_all

:build_android
echo [INFO] 构建 Android 应用...

echo [INFO] 构建开发环境...
call npm run build:android:dev
if errorlevel 1 (
    echo [ERROR] Android 开发环境构建失败
    exit /b 1
)
echo [SUCCESS] Android 开发环境构建完成

echo [INFO] 构建测试环境...
call npm run build:android:test
if errorlevel 1 (
    echo [ERROR] Android 测试环境构建失败
    exit /b 1
)
echo [SUCCESS] Android 测试环境构建完成

echo [INFO] 构建预发布环境...
call npm run build:android:staging
if errorlevel 1 (
    echo [ERROR] Android 预发布环境构建失败
    exit /b 1
)
echo [SUCCESS] Android 预发布环境构建完成

echo [INFO] 构建生产环境...
call npm run build:android:prod
if errorlevel 1 (
    echo [ERROR] Android 生产环境构建失败
    exit /b 1
)
echo [SUCCESS] Android 生产环境构建完成

goto :show_results

:build_ios
echo [INFO] 构建 iOS 应用...

echo [INFO] 构建开发环境...
call npm run build:ios:dev
if errorlevel 1 (
    echo [ERROR] iOS 开发环境构建失败
    exit /b 1
)
echo [SUCCESS] iOS 开发环境构建完成

echo [INFO] 构建测试环境...
call npm run build:ios:test
if errorlevel 1 (
    echo [ERROR] iOS 测试环境构建失败
    exit /b 1
)
echo [SUCCESS] iOS 测试环境构建完成

echo [INFO] 构建预发布环境...
call npm run build:ios:staging
if errorlevel 1 (
    echo [ERROR] iOS 预发布环境构建失败
    exit /b 1
)
echo [SUCCESS] iOS 预发布环境构建完成

echo [INFO] 构建生产环境...
call npm run build:ios:prod
if errorlevel 1 (
    echo [ERROR] iOS 生产环境构建失败
    exit /b 1
)
echo [SUCCESS] iOS 生产环境构建完成

goto :show_results

:build_all
call :build_android
if errorlevel 1 exit /b 1
call :build_ios
if errorlevel 1 exit /b 1

:show_results
echo [SUCCESS] 所有构建完成！

echo [INFO] 构建结果:
if "%PLATFORM%"=="android" goto :show_android_results
if "%PLATFORM%"=="ios" goto :show_ios_results
if "%PLATFORM%"=="all" goto :show_all_results

:show_android_results
echo [INFO] Android APK 位置:
for /r android\app\build\outputs\apk %%f in (*.apk) do echo   - %%f
goto :end

:show_ios_results
echo [INFO] iOS 构建位置:
for /r ios\build %%d in (*.app) do echo   - %%d
goto :end

:show_all_results
echo [INFO] Android APK 位置:
for /r android\app\build\outputs\apk %%f in (*.apk) do echo   - %%f
echo [INFO] iOS 构建位置:
for /r ios\build %%d in (*.app) do echo   - %%d
goto :end

:end
echo 构建完成！

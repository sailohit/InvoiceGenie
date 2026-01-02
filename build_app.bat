@echo off
echo ==========================================
echo      Invoice Genie Build Helper
echo ==========================================
echo.
echo This script helps you build the standalone .exe application.
echo.
echo IMPORTANT: If you see permission errors, please close this window,
echo right-click this file, and select "Run as Administrator".
echo.
pause

echo.
echo Setting working directory...
cd /d "%~dp0"

echo.
echo Closing any running instances...
taskkill /F /IM "Invoice Genie.exe" >nul 2>&1
taskkill /F /IM "electron.exe" >nul 2>&1

echo.
echo Cleaning previous build...
if exist "dist_electron" (
    rmdir /s /q "dist_electron"
    if exist "dist_electron" (
        echo.
        echo [ERROR] Cannot clean 'dist_electron' folder. 
        echo Please make sure the app is CLOSED and try again.
        pause
        exit /b 1
    )
)

echo.
echo Installing dependencies...
call npm install

echo.
echo Building application...
call npm run build:exe

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed! 
    echo Please try running this script as Administrator.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Build completed!
echo You can find the installer in the 'dist_electron' folder.
echo.
pause

@echo off
chcp 65001 > nul
title Floral Studio - Full Stack & Ngrok Tunnel
echo ========================================================
echo   🌸 FLORAL STUDIO - TOÀN BỘ DỊCH VỤ & NGROK PROXY
echo ========================================================
echo   1. Backend API  : http://localhost:3001
echo   2. Frontend Web : http://localhost:5173
echo   3. Ngrok Public : https://wimp-crumb-language.ngrok-free.dev
echo ========================================================
echo Đang kết nối dịch vụ và mở đường hầm trực tuyến...
echo.

npm run dev:all
pause

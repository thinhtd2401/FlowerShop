@echo off
chcp 65001 > nul
title KHflower Shop - Full Stack & Cloudflare Tunnel
echo ========================================================
echo   🌸 KHFLOWER SHOP - TOÀN BỘ DỊCH VỤ & CLOUDFLARE TUNNEL
echo ========================================================
echo   1. Backend API   : http://localhost:3001
echo   2. Frontend Web  : http://localhost:5173
echo   3. Public Tunnel : Cloudflare Quick Tunnel (Không giới hạn băng thông)
echo ========================================================
echo Đang kết nối dịch vụ và mở đường hầm trực tuyến...
echo (Đường dẫn công khai sẽ hiển thị bên dưới và lưu tại public-url.txt)
echo.

npm run dev:all
pause

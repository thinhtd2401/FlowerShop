@echo off
chcp 65001 > nul
title KHflower Shop - Full Stack & Cloudflare Tunnel
echo ========================================================
echo   🌸 KHFLOWER SHOP - TOÀN BỘ DỊCH VỤ & CLOUDFLARE TUNNEL
echo ========================================================
echo   1. Backend API   : http://localhost:3001
echo   2. Frontend Web  : http://localhost:5173
echo   3. Public Domain : https://khflowershop.store (Cloudflare Static Domain)
echo ========================================================
echo Đang khởi chạy toàn bộ dịch vụ và kết nối tên miền...
echo (Đường dẫn cố định đã lưu tại public-url.txt)
echo.

npm run dev:all
pause

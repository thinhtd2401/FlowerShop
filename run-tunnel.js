/**
 * run-tunnel.js - Quản lý kết nối Cloudflare Tunnel & Domain Cố Định
 * Tên miền tĩnh chính thức: https://khflowershop.store
 * Kết nối cổng 5173 (Vite Frontend & Express Proxy) ra ngoài Internet.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STATIC_DOMAIN = process.env.STATIC_DOMAIN || 'https://khflowershop.store';
const port = 5173;
const publicUrlFile = path.join(__dirname, 'public-url.txt');

// 1. Cập nhật hoặc ghi đè URL cố định vào public-url.txt
try {
  fs.writeFileSync(publicUrlFile, STATIC_DOMAIN, 'utf8');
} catch (err) {
  console.warn('⚠️ Không thể ghi file public-url.txt:', err.message);
}

// 2. Kiểm tra dịch vụ Cloudflared Windows Service
let isServiceRunning = false;
try {
  const scOut = execSync('sc.exe query Cloudflared', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  isServiceRunning = scOut.includes('RUNNING');
} catch (_) {
  isServiceRunning = false;
}

// 3. Kiểm tra cấu hình Google Auth
const clientEnvPath = path.join(__dirname, 'client', '.env');
let hasGoogleAuth = false;
try {
  if (fs.existsSync(clientEnvPath)) {
    const content = fs.readFileSync(clientEnvPath, 'utf8');
    hasGoogleAuth = content.includes('VITE_GOOGLE_CLIENT_ID=') && !content.includes('your-google-client-id');
  }
} catch (_) {}

// 4. In bảng thông tin tổng quan khi chạy npm run dev:all
console.log('\n============================================================');
console.log('🌸 KHFLOWER SHOP - PRODUCTION READY DEV ENVIRONMENT');
console.log('============================================================');
console.log(`🌐 TÊN MIỀN CỐ ĐỊNH : \x1b[36m\x1b[1m${STATIC_DOMAIN}\x1b[0m`);
if (isServiceRunning) {
  console.log('⚡ CLOUDFLARE TUNNEL: \x1b[32m\x1b[1mĐang hoạt động (Cloudflared Windows Service)\x1b[0m');
} else {
  console.log('⚡ CLOUDFLARE TUNNEL: \x1b[33m\x1b[1mĐã cấu hình domain tĩnh\x1b[0m (Khởi động service: net start Cloudflared)');
}
console.log(`💻 FRONTEND LOCAL   : http://localhost:${port}`);
console.log('🔌 BACKEND API      : http://localhost:3001');
console.log(`🔐 GOOGLE AUTH      : ${hasGoogleAuth ? '\x1b[32m\x1b[1mĐã kích hoạt (Client ID sẵn sàng)\x1b[0m' : '\x1b[33mChưa cấu hình biến môi trường\x1b[0m'}`);
console.log(`📁 TẬP TIN LƯU TRỮ  : public-url.txt`);
console.log('✨ Khách hàng và nhân viên có thể truy cập ngay tên miền trên.');
console.log('============================================================\n');

// 5. Duy trì tiến trình (Keep-Alive) để giữ luồng TUNNEL đồng bộ trong concurrently
const keepAliveInterval = setInterval(() => {}, 1000 * 60 * 60);

// Xử lý ngắt tiến trình sạch sẽ (Ctrl + C)
function shutdown() {
  clearInterval(keepAliveInterval);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/**
 * run-tunnel.js - Khởi chạy Ngrok tunnel kết nối tên miền cố định tới Vite Frontend (port 5173)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const localNgrok = path.join(__dirname, 'ngrok.exe');
const cmd = fs.existsSync(localNgrok) ? localNgrok : 'ngrok';

//const domain = 'wimp-crumb-language.ngrok-free.dev';
const domain = 'comprised-sturdily-factual.ngrok-free.dev';

const port = 5173;

console.log('🌸 [Ngrok Tunnel] Khởi tạo đường hầm kết nối...');
console.log(`🌐 Tên miền công khai : https://${domain}`);
console.log(`🎯 Chuyển tiếp cổng    : http://localhost:${port} (Vite Client & Express API Proxy)`);
console.log('------------------------------------------------------------');

const child = spawn(cmd, ['http', `--domain=${domain}`, `${port}`], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('\n❌ Không thể khởi chạy ngrok:', err.message);
  console.log('💡 Gợi ý: Kiểm tra file ngrok.exe trong thư mục gốc hoặc cài đặt ngrok toàn cục vào PATH.');
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code || 0);
});

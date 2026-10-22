/**
 * run-tunnel.js - Khởi chạy Cloudflare Tunnel (Quick Tunnel / TryCloudflare)
 * Kết nối cổng 5173 (Vite Frontend & Express Proxy) ra ngoài Internet.
 * Hoàn toàn miễn phí, không giới hạn băng thông, không có trang cảnh báo ngrok.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const localBin = path.join(__dirname, 'cloudflared.exe');
const cmd = fs.existsSync(localBin) ? localBin : 'cloudflared';
const port = 5173;

console.log('============================================================');
console.log('🌸 [Cloudflare Tunnel] Đang khởi tạo đường hầm kết nối...');
console.log(`🎯 Chuyển tiếp cổng    : http://localhost:${port} (Vite Client & Express Proxy)`);
console.log('⚡ Băng thông         : KHÔNG GIỚI HẠN (Unlimited)');
console.log('⏳ Vui lòng chờ 3-5 giây để nhận đường dẫn trực tuyến...');
console.log('============================================================\n');

// Khởi chạy cloudflared với cờ tạo tunnel nhanh trycloudflare.com
const args = ['tunnel', '--url', `http://localhost:${port}`];
const child = spawn(cmd, args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: false
});

let tunnelUrlFound = false;

function processOutput(data) {
  const text = data.toString();
  
  // Cloudflare thường log URL vào stderr dạng: https://xxxx.trycloudflare.com
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !tunnelUrlFound) {
    tunnelUrlFound = true;
    const publicUrl = match[0];
    
    // Ghi link ra file để tiện sao chép
    try {
      fs.writeFileSync(path.join(__dirname, 'public-url.txt'), publicUrl, 'utf8');
    } catch (_) {}

    console.log('\n============================================================');
    console.log('🚀 CLOUDFLARE TUNNEL ĐÃ SẴN SÀNG KẾT NỐI TOÀN CẦU!');
    console.log('============================================================');
    console.log(`🌐 ĐƯỜNG DẪN TRỰC TUYẾN : \x1b[36m\x1b[1m${publicUrl}\x1b[0m`);
    console.log(`📁 Đã lưu vào file      : public-url.txt`);
    console.log('✨ Khách hàng và nhân viên có thể truy cập ngay đường dẫn trên.');
    console.log('============================================================\n');
  }

  // Lọc hiển thị các lỗi quan trọng nếu có
  if (text.includes('ERR') || text.includes('failed to connect')) {
    process.stderr.write(text);
  }
}

child.stdout.on('data', processOutput);
child.stderr.on('data', processOutput);

child.on('error', (err) => {
  console.error('\n❌ Không thể khởi chạy cloudflared:', err.message);
  console.log('💡 Gợi ý: Kiểm tra file cloudflared.exe trong thư mục gốc dự án.');
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`\n🛑 Cloudflare Tunnel đã dừng (mã thoát: ${code}).`);
  process.exit(code || 0);
});

// Xử lý ngắt tiến trình sạch sẽ (Ctrl + C)
process.on('SIGINT', () => {
  if (child && !child.killed) {
    child.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (child && !child.killed) {
    child.kill('SIGTERM');
  }
  process.exit(0);
});

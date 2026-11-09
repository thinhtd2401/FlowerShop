/**
 * scripts/backup_db.js - Tự động sao lưu database SQLite an toàn trước khi migration
 */
const path = require('path');
const fs = require('fs');
const rootDir = path.resolve(__dirname, '..');
const Database = require(path.join(rootDir, 'server/node_modules/better-sqlite3'));

async function backupDatabase() {
  const dbPath = path.join(rootDir, 'server/data/flowershop.db');
  const backupsDir = path.join(rootDir, 'server/data/backups');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Không tìm thấy database tại:', dbPath);
    process.exit(1);
  }

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  
  const backupFileName = `flowershop_backup_pre_channel_${timestamp}.db`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  console.log('🔄 Đang tiến hành sao lưu database SQLite...');
  console.log(`- Nguồn: ${dbPath}`);
  console.log(`- Đích: ${backupFilePath}`);

  const sourceDb = new Database(dbPath);

  // 1. Thống kê trước sao lưu
  const orderCountBefore = sourceDb.prepare('SELECT count(*) as count FROM orders').get().count;
  const userCountBefore = sourceDb.prepare('SELECT count(*) as count FROM users').get().count;
  const expenseCountBefore = sourceDb.prepare('SELECT count(*) as count FROM expenses').get().count;

  console.log(`📊 Thống kê trước sao lưu:`);
  console.log(`  - Đơn hàng (orders): ${orderCountBefore}`);
  console.log(`  - Người dùng (users): ${userCountBefore}`);
  console.log(`  - Chi phí (expenses): ${expenseCountBefore}`);

  // 2. Chạy db.backup() chính thức của better-sqlite3 (checkpoint và flush toàn bộ WAL an toàn)
  await sourceDb.backup(backupFilePath);
  sourceDb.close();

  // 3. Snapshot thư mục chứa cả 3 file (.db, .db-wal, .db-shm nếu có)
  const snapshotFolder = path.join(backupsDir, `snapshot_raw_${timestamp}`);
  fs.mkdirSync(snapshotFolder, { recursive: true });
  fs.copyFileSync(dbPath, path.join(snapshotFolder, 'flowershop.db'));
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  if (fs.existsSync(walPath)) fs.copyFileSync(walPath, path.join(snapshotFolder, 'flowershop.db-wal'));
  if (fs.existsSync(shmPath)) fs.copyFileSync(shmPath, path.join(snapshotFolder, 'flowershop.db-shm'));

  // 4. Kiểm tra toàn vẹn (integrity check) trên file backup
  const backupDb = new Database(backupFilePath);
  const integrity = backupDb.pragma('integrity_check');
  const orderCountAfter = backupDb.prepare('SELECT count(*) as count FROM orders').get().count;
  backupDb.close();

  console.log('🔍 Kiểm tra tính toàn vẹn (integrity_check):', integrity);
  if (integrity[0]?.integrity_check === 'ok' && orderCountAfter === orderCountBefore) {
    console.log('✅ SAO LƯU THÀNH CÔNG VÀ TOÀN VẸN 100%!');
    console.log(`   - File backup độc lập: ${backupFileName}`);
    console.log(`   - Thư mục snapshot: snapshot_raw_${timestamp}`);
    console.log(`   - Số đơn hàng bảo toàn: ${orderCountAfter}/${orderCountBefore}`);
  } else {
    console.error('❌ Cảnh báo tính toàn vẹn không đạt yêu cầu!');
    process.exit(1);
  }
}

backupDatabase().catch(err => {
  console.error('❌ Lỗi sao lưu:', err);
  process.exit(1);
});

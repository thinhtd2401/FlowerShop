/**
 * database.js - SQLite connection & schema initialization
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/flowershop.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_date TEXT,
    customer_name TEXT NOT NULL DEFAULT 'Khách vãng lai',
    channel TEXT DEFAULT 'Thread',
    phone TEXT DEFAULT '',
    product_name TEXT DEFAULT 'Bó hoa tươi',
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    deposit_amount INTEGER DEFAULT 0,
    remaining_amount INTEGER DEFAULT 0,
    delivery_date TEXT,
    delivery_time TEXT DEFAULT '',
    delivery_type TEXT DEFAULT 'Khách qua lấy',
    status TEXT DEFAULT 'pending',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TEXT,
    category TEXT DEFAULT 'Hoa tươi',
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER DEFAULT 0,
    total_cost INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT,
    avatar TEXT DEFAULT '',
    auth_provider TEXT DEFAULT 'email',
    google_id TEXT,
    role TEXT DEFAULT 'staff',
    permissions TEXT DEFAULT '["orders","timeline"]',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
  );
`);

// Safe migrations for new fields
const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
if (!orderColumns.includes('delivery_address')) {
  db.exec("ALTER TABLE orders ADD COLUMN delivery_address TEXT DEFAULT ''");
}
if (!orderColumns.includes('card_message')) {
  db.exec("ALTER TABLE orders ADD COLUMN card_message TEXT DEFAULT ''");
}
if (!orderColumns.includes('recipient_name')) {
  db.exec("ALTER TABLE orders ADD COLUMN recipient_name TEXT DEFAULT ''");
}
if (!orderColumns.includes('recipient_phone')) {
  db.exec("ALTER TABLE orders ADD COLUMN recipient_phone TEXT DEFAULT ''");
}
if (!orderColumns.includes('images')) {
  db.exec("ALTER TABLE orders ADD COLUMN images TEXT DEFAULT '[]'");
}

module.exports = db;

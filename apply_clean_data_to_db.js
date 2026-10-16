/**
 * apply_clean_data_to_db.js
 * DO NOT RUN WITHOUT EXPLICIT USER APPROVAL.
 * 
 * When approved, this script will:
 * 1. Back up flowershop.db to flowershop.db.bak
 * 2. Clear table orders and expenses
 * 3. Read clean_data.xlsx and insert 66 orders & 15 expenses
 * 4. Update js/initialData.js to keep in sync
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('./server/src/db/database');

const CLEAN_FILE = path.join(__dirname, 'clean_data.xlsx');
const DB_PATH = path.join(__dirname, 'server/data/flowershop.db');
const BAK_PATH = path.join(__dirname, 'server/data/flowershop.db.bak');
const INITIAL_DATA_PATH = path.join(__dirname, 'js/initialData.js');

function runUpdate() {
  console.log('🚀 Starting Database Update from clean_data.xlsx...');

  if (!fs.existsSync(CLEAN_FILE)) {
    throw new Error('clean_data.xlsx not found!');
  }

  // Backup DB
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, BAK_PATH);
    console.log(`📦 Backup created: ${BAK_PATH}`);
  }

  const wb = XLSX.readFile(CLEAN_FILE);
  const ordersData = XLSX.utils.sheet_to_json(wb.Sheets['Đơn Hàng (Orders)']);
  const expensesData = XLSX.utils.sheet_to_json(wb.Sheets['Chi Phí Vốn (Expenses)']);

  console.log(`Found ${ordersData.length} orders and ${expensesData.length} expenses in clean_data.xlsx.`);

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, order_date, customer_name, channel, phone, product_name,
      quantity, unit_price, total_amount, deposit_amount, remaining_amount,
      delivery_date, delivery_time, delivery_type, delivery_address,
      card_message, recipient_name, recipient_phone, status, notes
    ) VALUES (
      @id, @order_date, @customer_name, @channel, @phone, @product_name,
      @quantity, @unit_price, @total_amount, @deposit_amount, @remaining_amount,
      @delivery_date, @delivery_time, @delivery_type, @delivery_address,
      @card_message, @recipient_name, @recipient_phone, @status, @notes
    )
  `);

  const insertExpense = db.prepare(`
    INSERT INTO expenses (
      id, date, category, item_name, quantity, unit_price, total_cost
    ) VALUES (
      @id, @date, @category, @item_name, @quantity, @unit_price, @total_cost
    )
  `);

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM expenses').run();
    console.log('🗑️  Cleared existing rows from orders and expenses.');

    for (const o of ordersData) {
      insertOrder.run({
        id: o['Mã Đơn (id)'],
        order_date: o['Ngày Nhận Đơn (order_date)'] || '',
        customer_name: (o['Tên Khách Hàng (customer_name)'] || 'Khách vãng lai').trim(),
        channel: o['Kênh Bán (channel)'] || 'Instagram',
        phone: String(o['Số Điện Thoại (phone)'] || '').trim(),
        product_name: (o['Loại Hoa / Sản Phẩm (product_name)'] || 'Bó hoa tươi').trim(),
        quantity: Number(o['Số Lượng (quantity)']) || 1,
        unit_price: Number(o['Đơn Giá (unit_price)']) || 0,
        total_amount: Number(o['Tổng Tiền (total_amount)']) || 0,
        deposit_amount: Number(o['Tiền Cọc (deposit_amount)']) || 0,
        remaining_amount: Number(o['Còn Lại (remaining_amount)']) || 0,
        delivery_date: o['Ngày Hẹn Giao (delivery_date)'] || '',
        delivery_time: String(o['Giờ Hẹn Giao (delivery_time)'] || '').trim(),
        delivery_type: o['Hình Thức Giao (delivery_type)'] || 'Khách qua lấy',
        delivery_address: String(o['Địa Chỉ Giao (delivery_address)'] || '').trim(),
        card_message: String(o['Lời Chúc Thiệp (card_message)'] || '').trim(),
        recipient_name: String(o['Người Nhận (recipient_name)'] || '').trim(),
        recipient_phone: String(o['SĐT Người Nhận (recipient_phone)'] || '').trim(),
        status: o['Trạng Thái DB (status)'] || 'pending',
        notes: String(o['Ghi Chú Gốc (notes)'] || '').trim()
      });
    }

    for (const e of expensesData) {
      insertExpense.run({
        id: e['Mã Chi Phí (id)'],
        date: e['Ngày Chi (date)'] || '',
        category: e['Danh Mục (category)'] || 'Hoa tươi',
        item_name: (e['Tên Mặt Hàng / Chi Phí (item_name)'] || '').trim(),
        quantity: Number(e['Số Lượng (quantity)']) || 1,
        unit_price: Number(e['Đơn Giá (unit_price)']) || 0,
        total_cost: Number(e['Tổng Tiền Vốn (total_cost)']) || 0
      });
    }
  });

  transaction();

  // Verification
  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const expenseCount = db.prepare('SELECT COUNT(*) as c FROM expenses').get().c;
  const totalRev = db.prepare('SELECT SUM(total_amount) as s FROM orders').get().s;
  const totalCost = db.prepare('SELECT SUM(total_cost) as s FROM expenses').get().s;

  console.log(`\n🎉 Update Complete!`);
  console.log(`Database Orders: ${orderCount} (Total: ${totalRev.toLocaleString('vi-VN')} đ)`);
  console.log(`Database Expenses: ${expenseCount} (Total: ${totalCost.toLocaleString('vi-VN')} đ)`);

  // Also sync js/initialData.js
  const initialOrders = ordersData.map(o => ({
    id: o['Mã Đơn (id)'],
    orderDate: o['Ngày Nhận Đơn (order_date)'] || '',
    customerName: (o['Tên Khách Hàng (customer_name)'] || 'Khách vãng lai').trim(),
    channel: o['Kênh Bán (channel)'] || 'Instagram',
    phone: String(o['Số Điện Thoại (phone)'] || '').trim(),
    productName: (o['Loại Hoa / Sản Phẩm (product_name)'] || 'Bó hoa tươi').trim(),
    quantity: Number(o['Số Lượng (quantity)']) || 1,
    unitPrice: Number(o['Đơn Giá (unit_price)']) || 0,
    totalAmount: Number(o['Tổng Tiền (total_amount)']) || 0,
    depositAmount: Number(o['Tiền Cọc (deposit_amount)']) || 0,
    remainingAmount: Number(o['Còn Lại (remaining_amount)']) || 0,
    deliveryDate: o['Ngày Hẹn Giao (delivery_date)'] || '',
    deliveryTime: String(o['Giờ Hẹn Giao (delivery_time)'] || '').trim(),
    deliveryType: o['Hình Thức Giao (delivery_type)'] || 'Khách qua lấy',
    status: o['Trạng Thái DB (status)'] || 'pending',
    notes: String(o['Ghi Chú Gốc (notes)'] || '').trim()
  }));

  const initialExpenses = expensesData.map(e => ({
    id: e['Mã Chi Phí (id)'],
    date: e['Ngày Chi (date)'] || '',
    category: e['Danh Mục (category)'] || 'Hoa tươi',
    itemName: (e['Tên Mặt Hàng / Chi Phí (item_name)'] || '').trim(),
    quantity: Number(e['Số Lượng (quantity)']) || 1,
    unitPrice: Number(e['Đơn Giá (unit_price)']) || 0,
    totalCost: Number(e['Tổng Tiền Vốn (total_cost)']) || 0
  }));

  const initialContent = `// Cleaned data synced from 16_10_2026.xlsx\nwindow.INITIAL_ORDERS = ${JSON.stringify(initialOrders, null, 2)};\n\nwindow.INITIAL_EXPENSES = ${JSON.stringify(initialExpenses, null, 2)};\n`;
  fs.writeFileSync(INITIAL_DATA_PATH, initialContent, 'utf8');
  console.log(`📝 Synced js/initialData.js with clean data.`);
}

if (process.argv.includes('--execute')) {
  runUpdate();
} else {
  console.log('⚠️  Safety check: Pass --execute to apply changes to database.');
}

module.exports = { runUpdate };

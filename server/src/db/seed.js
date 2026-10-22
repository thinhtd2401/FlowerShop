/**
 * seed.js - Import initialData.js into SQLite on first run
 */
const db = require('./database');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Load seed data from local seedData.json
function loadSeedData() {
  const filePath = path.join(__dirname, 'seedData.json');
  if (!fs.existsSync(filePath)) {
    console.warn('⚠️  seedData.json not found, skipping seed.');
    return { orders: [], expenses: [] };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return {
      orders: data.orders || [],
      expenses: data.expenses || []
    };
  } catch (err) {
    console.error('❌ Error parsing seedData.json:', err.message);
    return { orders: [], expenses: [] };
  }
}

function seedUsersIfEmpty() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      console.log('🌱 Seeding initial admin and staff users...');
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      const staffPasswordHash = bcrypt.hashSync('nhanvien123', 10);

      const insertUser = db.prepare(`
        INSERT INTO users (id, email, name, password_hash, role, permissions, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // 1. Super Admin
      insertUser.run(
        'user_admin_01',
        'admin@khflowershop.vn',
        'Quản Trị Viên (Chủ Tiệm)',
        adminPasswordHash,
        'admin',
        JSON.stringify(['orders', 'timeline', 'expenses']),
        'active'
      );

      // 2. Sample Staff (for immediate testing of permissions)
      insertUser.run(
        'user_staff_01',
        'nhanvien@khflowershop.vn',
        'Thợ Cắm Hoa (Nhân viên mẫu)',
        staffPasswordHash,
        'staff',
        JSON.stringify(['orders', 'timeline']),
        'active'
      );

      console.log('✅ Created default admin (admin@khflowershop.vn / admin123) and staff (nhanvien@khflowershop.vn / nhanvien123).');
    }
  } catch (err) {
    console.error('❌ Error seeding users:', err.message);
  }
}

function seedIfEmpty() {
  seedUsersIfEmpty();

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const expenseCount = db.prepare('SELECT COUNT(*) as count FROM expenses').get().count;

  if (orderCount > 0 && expenseCount > 0) {
    console.log(`✅ Database already seeded: ${orderCount} orders, ${expenseCount} expenses.`);
    return;
  }

  console.log('🌱 Seeding database from initialData.js...');
  const { orders, expenses } = loadSeedData();

  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO orders (
      id, order_date, customer_name, channel, phone, product_name,
      quantity, unit_price, total_amount, deposit_amount, remaining_amount,
      delivery_date, delivery_time, delivery_type, status, notes
    ) VALUES (
      @id, @orderDate, @customerName, @channel, @phone, @productName,
      @quantity, @unitPrice, @totalAmount, @depositAmount, @remainingAmount,
      @deliveryDate, @deliveryTime, @deliveryType, @status, @notes
    )
  `);

  const insertExpense = db.prepare(`
    INSERT OR IGNORE INTO expenses (
      id, date, category, item_name, quantity, unit_price, total_cost
    ) VALUES (
      @id, @date, @category, @itemName, @quantity, @unitPrice, @totalCost
    )
  `);

  const seedOrders = db.transaction((orders) => {
    for (const o of orders) {
      insertOrder.run({
        id: o.id,
        orderDate: o.orderDate,
        customerName: o.customerName,
        channel: o.channel,
        phone: o.phone || '',
        productName: o.productName,
        quantity: o.quantity,
        unitPrice: o.unitPrice,
        totalAmount: o.totalAmount,
        depositAmount: o.depositAmount || 0,
        remainingAmount: o.remainingAmount || 0,
        deliveryDate: o.deliveryDate,
        deliveryTime: o.deliveryTime || '',
        deliveryType: o.deliveryType,
        status: o.status,
        notes: o.notes || ''
      });
    }
  });

  const seedExpenses = db.transaction((expenses) => {
    for (const e of expenses) {
      insertExpense.run({
        id: e.id,
        date: e.date,
        category: e.category,
        itemName: e.itemName,
        quantity: e.quantity,
        unitPrice: e.unitPrice,
        totalCost: e.totalCost
      });
    }
  });

  seedOrders(orders);
  seedExpenses(expenses);

  console.log(`✅ Seeded ${orders.length} orders and ${expenses.length} expenses.`);
}

module.exports = { seedIfEmpty };

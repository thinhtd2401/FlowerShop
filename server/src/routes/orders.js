/**
 * routes/orders.js - CRUD API for orders
 */
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Helper: map DB row (snake_case) to camelCase
function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderDate: row.order_date,
    customerName: row.customer_name,
    channel: row.channel,
    phone: row.phone,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalAmount: row.total_amount,
    depositAmount: row.deposit_amount,
    remainingAmount: row.remaining_amount,
    deliveryDate: row.delivery_date,
    deliveryTime: row.delivery_time,
    deliveryType: row.delivery_type,
    deliveryAddress: row.delivery_address || '',
    cardMessage: row.card_message || '',
    recipientName: row.recipient_name || '',
    recipientPhone: row.recipient_phone || '',
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at
  };
}

// GET /api/orders - Lấy tất cả đơn hàng
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(rows.map(rowToOrder));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id - Lấy 1 đơn
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    res.json(rowToOrder(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders - Tạo đơn mới
router.post('/', (req, res) => {
  try {
    const data = req.body;

    // Generate new ID
    const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as maxNum FROM orders WHERE id LIKE 'DH-%'").get();
    const maxNum = maxRow?.maxNum || 0;
    const newId = `DH-${String(maxNum + 1).padStart(3, '0')}`;

    const quantity = parseInt(data.quantity) || 1;
    const unitPrice = parseInt(data.unitPrice) || 0;
    const totalAmount = quantity * unitPrice;
    const depositAmount = parseInt(data.depositAmount) || 0;
    const remainingAmount = Math.max(0, totalAmount - depositAmount);

    const today = new Date().toLocaleDateString('vi-VN');

    db.prepare(`
      INSERT INTO orders (
        id, order_date, customer_name, channel, phone, product_name,
        quantity, unit_price, total_amount, deposit_amount, remaining_amount,
        delivery_date, delivery_time, delivery_type, delivery_address,
        card_message, recipient_name, recipient_phone, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      data.orderDate || today,
      (data.customerName || 'Khách vãng lai').trim(),
      data.channel || 'Instagram',
      (data.phone || '').trim(),
      (data.productName || 'Bó hoa tươi').trim(),
      quantity,
      unitPrice,
      totalAmount,
      depositAmount,
      remainingAmount,
      data.deliveryDate || today,
      (data.deliveryTime || '').trim(),
      data.deliveryType || 'Khách qua lấy',
      (data.deliveryAddress || '').trim(),
      (data.cardMessage || '').trim(),
      (data.recipientName || '').trim(),
      (data.recipientPhone || '').trim(),
      data.status || 'pending',
      (data.notes || '').trim()
    );

    const newRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(newId);
    res.status(201).json(rowToOrder(newRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id - Cập nhật đơn
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    const data = req.body;
    const quantity = parseInt(data.quantity ?? existing.quantity) || 1;
    const unitPrice = parseInt(data.unitPrice ?? existing.unit_price) || 0;
    const totalAmount = quantity * unitPrice;
    const depositAmount = parseInt(data.depositAmount ?? existing.deposit_amount) || 0;
    const remainingAmount = Math.max(0, totalAmount - depositAmount);

    db.prepare(`
      UPDATE orders SET
        order_date = ?, customer_name = ?, channel = ?, phone = ?,
        product_name = ?, quantity = ?, unit_price = ?, total_amount = ?,
        deposit_amount = ?, remaining_amount = ?, delivery_date = ?,
        delivery_time = ?, delivery_type = ?, delivery_address = ?,
        card_message = ?, recipient_name = ?, recipient_phone = ?,
        status = ?, notes = ?
      WHERE id = ?
    `).run(
      (data.orderDate ?? existing.order_date),
      (data.customerName ?? existing.customer_name).trim(),
      (data.channel ?? existing.channel),
      ((data.phone ?? existing.phone) || '').trim(),
      (data.productName ?? existing.product_name).trim(),
      quantity, unitPrice, totalAmount, depositAmount, remainingAmount,
      (data.deliveryDate ?? existing.delivery_date),
      ((data.deliveryTime ?? existing.delivery_time) || '').trim(),
      (data.deliveryType ?? existing.delivery_type),
      ((data.deliveryAddress ?? existing.delivery_address) || '').trim(),
      ((data.cardMessage ?? existing.card_message) || '').trim(),
      ((data.recipientName ?? existing.recipient_name) || '').trim(),
      ((data.recipientPhone ?? existing.recipient_phone) || '').trim(),
      (data.status ?? existing.status),
      ((data.notes ?? existing.notes) || '').trim(),
      id
    );

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(rowToOrder(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status - Đổi trạng thái nhanh
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    // If completed, set remaining = 0
    const remaining = status === 'completed' ? 0 : existing.remaining_amount;
    db.prepare('UPDATE orders SET status = ?, remaining_amount = ? WHERE id = ?').run(status, remaining, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(rowToOrder(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id - Xóa đơn
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    res.json({ success: true, message: 'Đã xóa đơn hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

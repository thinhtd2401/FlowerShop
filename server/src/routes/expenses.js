/**
 * routes/expenses.js - CRUD API for expenses
 */
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Bảo vệ tất cả endpoints của expenses: Yêu cầu đăng nhập và có quyền 'expenses'
router.use(authenticateToken);
router.use(requirePermission('expenses'));

function rowToExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    itemName: row.item_name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalCost: row.total_cost,
    createdAt: row.created_at
  };
}

// GET /api/expenses
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all();
    res.json(rows.map(rowToExpense));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expenses/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy khoản chi phí' });
    res.json(rowToExpense(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses
router.post('/', (req, res) => {
  try {
    const data = req.body;

    const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) as maxNum FROM expenses WHERE id LIKE 'EXP-%'").get();
    const maxNum = maxRow?.maxNum || 0;
    const newId = `EXP-${String(maxNum + 1).padStart(3, '0')}`;

    const quantity = parseInt(data.quantity) || 1;
    const unitPrice = parseInt(data.unitPrice) || 0;
    const totalCost = quantity * unitPrice;
    const today = new Date().toLocaleDateString('vi-VN');

    db.prepare(`
      INSERT INTO expenses (id, date, category, item_name, quantity, unit_price, total_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      data.date || today,
      data.category || 'Hoa tươi',
      (data.itemName || 'Chi phí nhập hàng').trim(),
      quantity,
      unitPrice,
      totalCost
    );

    const newRow = db.prepare('SELECT * FROM expenses WHERE id = ?').get(newId);
    res.status(201).json(rowToExpense(newRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/expenses/:id - Cập nhật khoản chi phí
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy khoản chi phí' });

    const data = req.body;
    const quantity = parseInt(data.quantity ?? existing.quantity) || 1;
    const unitPrice = parseInt(data.unitPrice ?? existing.unit_price) || 0;
    const totalCost = quantity * unitPrice;

    db.prepare(`
      UPDATE expenses SET
        date = ?, category = ?, item_name = ?,
        quantity = ?, unit_price = ?, total_cost = ?
      WHERE id = ?
    `).run(
      (data.date ?? existing.date),
      (data.category ?? existing.category),
      ((data.itemName ?? existing.item_name) || '').trim(),
      quantity,
      unitPrice,
      totalCost,
      id
    );

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.json(rowToExpense(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Không tìm thấy khoản chi' });
    res.json({ success: true, message: 'Đã xóa khoản chi phí' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

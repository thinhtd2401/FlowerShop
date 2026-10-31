/**
 * routes/users.js - User Management & Screen Permission Assignment
 * Accessible only by Admin & Manager (Quản trị), except /assignees which is for all authenticated users
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { formatUser, authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticateToken);

// GET /api/users/assignees - Danh sách người dùng rút gọn để phân công nhận đơn (mọi nhân viên đều có thể gọi)
router.get('/assignees', (req, res) => {
  try {
    const rows = db.prepare("SELECT id, name, email, avatar, role FROM users WHERE status = 'active' ORDER BY name ASC").all();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi tải danh sách người tiếp nhận: ' + err.message });
  }
});

// All following routes require at least 'manager' or 'admin'
router.use(requireRole(['admin', 'manager']));

// GET /api/users - Danh sách người dùng đầy đủ cho quản trị
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all();
    return res.json(rows.map(formatUser));
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi tải danh sách người dùng: ' + err.message });
  }
});

// POST /api/users - Tạo người dùng mới từ trang quản trị
router.post('/', (req, res) => {
  try {
    const { email, name, password, role = 'staff', permissions = ['orders', 'timeline'], status = 'active', isSalaryEligible = 0 } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email và Tên người dùng là bắt buộc' });
    }

    // Role validation
    if (!['admin', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ' });
    }

    // Manager cannot create an Admin
    if (req.user.role === 'manager' && role === 'admin') {
      return res.status(403).json({ error: 'Quản trị viên không thể tạo tài khoản cấp Admin' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống' });
    }

    const newId = `user_${Date.now()}`;
    const passwordHash = password ? bcrypt.hashSync(password, 10) : bcrypt.hashSync('123456', 10);
    const validPerms = Array.isArray(permissions) ? permissions : ['orders', 'timeline'];
    const eligibleInt = isSalaryEligible ? 1 : 0;

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role, permissions, status, is_salary_eligible, auth_provider)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'email')
    `).run(
      newId,
      normalizedEmail,
      name.trim(),
      passwordHash,
      role,
      JSON.stringify(validPerms),
      status,
      eligibleInt
    );

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
    return res.status(201).json(formatUser(created));
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi tạo người dùng: ' + err.message });
  }
});

// PUT /api/users/:id - Sửa thông tin, gán vai trò & phân quyền
router.put('/:id', (req, res) => {
  try {
    const targetId = req.params.id;
    const { name, role, permissions, status, newPassword, isSalaryEligible } = req.body;

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // Safeguard: Cannot block your own account
    if (req.user.id === targetId && status === 'blocked') {
      return res.status(400).json({ error: 'Bạn không thể tự khóa tài khoản của chính mình' });
    }

    // Safeguard: Manager cannot demote or modify an Admin account
    if (req.user.role === 'manager' && targetUser.role === 'admin') {
      return res.status(403).json({ error: 'Quản trị viên không có quyền chỉnh sửa tài khoản Admin' });
    }

    // Safeguard: Manager cannot promote anyone to Admin
    if (req.user.role === 'manager' && role === 'admin') {
      return res.status(403).json({ error: 'Quản trị viên không có quyền nâng cấp thành Admin' });
    }

    // Prepare update fields
    let updatedName = name ? name.trim() : targetUser.name;
    let updatedRole = role && ['admin', 'manager', 'staff'].includes(role) ? role : targetUser.role;
    let updatedStatus = status && ['active', 'blocked'].includes(status) ? status : targetUser.status;
    let updatedEligible = isSalaryEligible !== undefined ? (isSalaryEligible ? 1 : 0) : targetUser.is_salary_eligible;

    let updatedPermissions = targetUser.permissions;
    if (Array.isArray(permissions)) {
      updatedPermissions = JSON.stringify(permissions);
    }

    // If role is admin or manager, give all permissions
    if (updatedRole === 'admin' || updatedRole === 'manager') {
      updatedPermissions = JSON.stringify(['orders', 'timeline', 'expenses']);
    }

    if (newPassword && newPassword.trim().length >= 6) {
      const hash = bcrypt.hashSync(newPassword.trim(), 10);
      db.prepare(`
        UPDATE users
        SET name = ?, role = ?, permissions = ?, status = ?, is_salary_eligible = ?, password_hash = ?
        WHERE id = ?
      `).run(updatedName, updatedRole, updatedPermissions, updatedStatus, updatedEligible, hash, targetId);
    } else {
      db.prepare(`
        UPDATE users
        SET name = ?, role = ?, permissions = ?, status = ?, is_salary_eligible = ?
        WHERE id = ?
      `).run(updatedName, updatedRole, updatedPermissions, updatedStatus, updatedEligible, targetId);
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    return res.json(formatUser(updated));
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi cập nhật người dùng: ' + err.message });
  }
});

// DELETE /api/users/:id - Xóa người dùng (Chỉ Admin)
router.delete('/:id', requireRole(['admin']), (req, res) => {
  try {
    const targetId = req.params.id;

    if (req.user.id === targetId) {
      return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản của chính mình' });
    }

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    if (targetUser.email === 'admin@khflowershop.vn') {
      return res.status(400).json({ error: 'Không thể xóa tài khoản Quản trị viên gốc của hệ thống' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
    return res.json({ message: 'Đã xóa người dùng thành công' });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi xóa người dùng: ' + err.message });
  }
});

module.exports = router;

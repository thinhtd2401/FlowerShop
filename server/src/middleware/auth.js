/**
 * middleware/auth.js - JWT Authentication & User Extraction
 */
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'khflowershop-super-secure-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

// Convert user DB row to safe public user object
function formatUser(row) {
  if (!row) return null;
  let permissions = [];
  try {
    permissions = Array.isArray(row.permissions) ? row.permissions : JSON.parse(row.permissions || '[]');
  } catch {
    permissions = ['orders', 'timeline'];
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar || '',
    authProvider: row.auth_provider || 'email',
    role: row.role || 'staff',
    permissions,
    status: row.status || 'active',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Middleware: Authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập để truy cập tài nguyên này' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
    }

    try {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
      if (!row) {
        return res.status(401).json({ error: 'Người dùng không tồn tại hoặc đã bị xóa' });
      }

      if (row.status === 'blocked') {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên' });
      }

      req.user = formatUser(row);
      next();
    } catch (dbErr) {
      return res.status(500).json({ error: 'Lỗi xác thực hệ thống: ' + dbErr.message });
    }
  });
}

// Optional Auth: If token provided, attach user, but don't fail if not
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
      if (row && row.status !== 'blocked') {
        req.user = formatUser(row);
      }
    }
    next();
  });
}

module.exports = {
  JWT_SECRET,
  formatUser,
  generateToken,
  authenticateToken,
  optionalAuth
};

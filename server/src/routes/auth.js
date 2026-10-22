/**
 * routes/auth.js - Authentication Routes (Google Sign-In, Email/Password, Register, Me)
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db/database');
const { formatUser, generateToken, authenticateToken } = require('../middleware/auth');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/login - Email + Password
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Email và Mật khẩu' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên' });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        error: 'Tài khoản này được đăng ký qua Google. Vui lòng sử dụng nút "Đăng nhập bằng Google"'
      });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }

    // Update last login
    db.prepare("UPDATE users SET last_login_at = datetime('now', 'localtime') WHERE id = ?").run(user.id);
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

    const token = generateToken(updatedUser);
    return res.json({
      token,
      user: formatUser(updatedUser),
      message: 'Đăng nhập thành công'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi đăng nhập: ' + err.message });
  }
});

// POST /api/auth/google - Google OAuth 2.0 Sign-In / Sign-Up
router.post('/google', async (req, res) => {
  try {
    const { credential, devMock } = req.body;

    let googleData = null;

    // 1. If real Google credential provided and Client ID configured
    if (credential && credential !== 'demo_google_token') {
      try {
        if (GOOGLE_CLIENT_ID) {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
          });
          const payload = ticket.getPayload();
          googleData = {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            avatar: payload.picture || ''
          };
        } else {
          // Fallback verify without strict audience if GOOGLE_CLIENT_ID not yet in server env
          const ticket = await googleClient.verifyIdToken({ idToken: credential });
          const payload = ticket.getPayload();
          googleData = {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            avatar: payload.picture || ''
          };
        }
      } catch (verifyErr) {
        // If Google token verification fails and devMock is allowed
        if (!devMock) {
          return res.status(401).json({ error: 'Xác thực tài khoản Google không thành công: ' + verifyErr.message });
        }
      }
    }

    // 2. Dev Demo Fallback (khi chưa cấu hình Google Client ID hoặc thử nghiệm dev)
    if (!googleData && devMock) {
      googleData = {
        googleId: 'google_demo_' + Date.now(),
        email: devMock.email || 'demouser@gmail.com',
        name: devMock.name || 'Người dùng Google Demo',
        avatar: devMock.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
      };
    }

    if (!googleData || !googleData.email) {
      return res.status(400).json({ error: 'Không nhận được thông tin xác thực từ Google' });
    }

    const normalizedEmail = googleData.email.trim().toLowerCase();
    let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail);

    if (user) {
      if (user.status === 'blocked') {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên' });
      }

      // Update avatar and google_id if missing
      db.prepare(`
        UPDATE users
        SET avatar = COALESCE(NULLIF(avatar, ''), ?),
            google_id = COALESCE(google_id, ?),
            last_login_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(googleData.avatar || '', googleData.googleId || '', user.id);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      // Auto-create new staff user as decided
      const newId = `user_${Date.now()}`;
      const defaultRole = 'staff';
      const defaultPermissions = JSON.stringify(['orders', 'timeline']);

      db.prepare(`
        INSERT INTO users (id, email, name, avatar, auth_provider, google_id, role, permissions, status, last_login_at)
        VALUES (?, ?, ?, ?, 'google', ?, ?, ?, 'active', datetime('now', 'localtime'))
      `).run(
        newId,
        normalizedEmail,
        googleData.name || normalizedEmail.split('@')[0],
        googleData.avatar || '',
        googleData.googleId || '',
        defaultRole,
        defaultPermissions
      );

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: formatUser(user),
      message: 'Đăng nhập Google thành công'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi xác thực Google: ' + err.message });
  }
});

// POST /api/auth/register - Đăng ký tài khoản nhân viên mới
router.post('/register', (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác' });
    }

    const newId = `user_${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const defaultRole = 'staff';
    const defaultPermissions = JSON.stringify(['orders', 'timeline']);

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, auth_provider, role, permissions, status, last_login_at)
      VALUES (?, ?, ?, ?, 'email', ?, ?, 'active', datetime('now', 'localtime'))
    `).run(
      newId,
      normalizedEmail,
      name.trim(),
      passwordHash,
      defaultRole,
      defaultPermissions
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
    const token = generateToken(newUser);

    return res.status(201).json({
      token,
      user: formatUser(newUser),
      message: 'Đăng ký tài khoản nhân viên thành công'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi đăng ký: ' + err.message });
  }
});

// GET /api/auth/me - Lấy thông tin user hiện tại
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

// PUT /api/auth/change-password - Đổi mật khẩu
router.put('/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    if (user.password_hash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại' });
      }
      const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
      }
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    return res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi đổi mật khẩu: ' + err.message });
  }
});

module.exports = router;

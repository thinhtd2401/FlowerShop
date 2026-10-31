/**
 * routes/salary.js - Salary Calculation & Daily Ratio Allocation Management
 * Accessible ONLY by Admin & Manager
 */
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// BẢO MẬT: Chỉ Admin và Manager mới có quyền truy cập thông tin và quản lý lương
router.use(authenticateToken);
router.use(requireRole(['admin', 'manager']));

/**
 * Parse dd/mm/yyyy string to Date object
 * @param {string} str
 * @returns {Date|null}
 */
const parseDMY = (str) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
};

/**
 * Format Date object to dd/mm/yyyy string
 * @param {Date} date
 * @returns {string}
 */
const formatDMY = (date) => {
  if (!date) return null;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

// GET /api/salary/config - Lấy danh sách nhân sự tham gia tính lương
router.get('/config', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, avatar, role, status, is_salary_eligible
      FROM users
      ORDER BY role ASC, name ASC
    `).all();

    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar || '',
      role: u.role,
      status: u.status,
      isSalaryEligible: Boolean(u.is_salary_eligible)
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải cấu hình nhân sự tính lương: ' + err.message });
  }
});

// PUT /api/salary/config - Admin cập nhật danh sách người tham gia tính lương
router.put('/config', (req, res) => {
  try {
    const { eligibleUserIds } = req.body;
    if (!Array.isArray(eligibleUserIds)) {
      return res.status(400).json({ error: 'eligibleUserIds phải là một mảng ID' });
    }

    const updateAllZero = db.prepare('UPDATE users SET is_salary_eligible = 0');
    const updateEligible = db.prepare('UPDATE users SET is_salary_eligible = 1 WHERE id = ?');

    const transaction = db.transaction(() => {
      updateAllZero.run();
      for (const id of eligibleUserIds) {
        updateEligible.run(id);
      }
    });

    transaction();

    const users = db.prepare(`
      SELECT id, name, email, avatar, role, status, is_salary_eligible
      FROM users
      ORDER BY role ASC, name ASC
    `).all();

    res.json({
      success: true,
      message: 'Cập nhật danh sách người tham gia tính lương thành công',
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || '',
        role: u.role,
        status: u.status,
        isSalaryEligible: Boolean(u.is_salary_eligible)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật danh sách tính lương: ' + err.message });
  }
});

// GET /api/salary/overview - Bảng tổng quan lương theo khoảng ngày & chi tiết từng ngày
router.get('/overview', (req, res) => {
  try {
    const { from, to, dateField } = req.query;
    const filterField = dateField === 'delivery_date' ? 'delivery_date' : 'order_date';

    const fromDate = parseDMY(from);
    const toDate = parseDMY(to);

    // Lấy toàn bộ người dùng active
    const allUsers = db.prepare(`
      SELECT id, name, email, avatar, role, is_salary_eligible
      FROM users
      WHERE status = 'active'
      ORDER BY role ASC, name ASC
    `).all().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar || '',
      role: u.role,
      isSalaryEligible: Boolean(u.is_salary_eligible)
    }));

    const eligibleUsers = allUsers.filter(u => u.isSalaryEligible);

    // Lấy tất cả đơn hàng (loại trừ đã hủy)
    let allOrders = db.prepare("SELECT * FROM orders WHERE status != 'cancelled'").all();
    let allExpenses = db.prepare("SELECT * FROM expenses").all();

    // Lọc theo khoảng ngày
    if (fromDate || toDate) {
      allOrders = allOrders.filter(o => {
        const d = parseDMY(o[filterField]);
        if (!d) return true;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });

      allExpenses = allExpenses.filter(e => {
        const d = parseDMY(e.date);
        if (!d) return true;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    // Tập hợp tất cả các ngày có phát sinh đơn hoặc chi phí
    const dateSet = new Set();
    allOrders.forEach(o => {
      if (o[filterField]) dateSet.add(o[filterField]);
    });
    allExpenses.forEach(e => {
      if (e.date) dateSet.add(e.date);
    });

    // Sắp xếp ngày từ mới nhất đến cũ nhất
    const sortedDates = Array.from(dateSet).sort((a, b) => {
      const da = parseDMY(a);
      const dbDate = parseDMY(b);
      if (!da || !dbDate) return 0;
      return dbDate - da;
    });

    // Thống kê phân công đơn hàng theo từng người trong khoảng thời gian lọc
    const userOrderStats = {};
    allUsers.forEach(u => {
      userOrderStats[u.id] = {
        orderCount: 0,
        orderTotalAmount: 0
      };
    });

    allOrders.forEach(o => {
      const assignedId = o.assigned_user_id;
      if (assignedId && userOrderStats[assignedId]) {
        userOrderStats[assignedId].orderCount += 1;
        userOrderStats[assignedId].orderTotalAmount += (o.total_amount || 0);
      }
    });

    // Lấy toàn bộ cấu hình tùy biến ngày trong DB
    const customConfigs = db.prepare("SELECT * FROM daily_salary_config").all();
    const configByDate = {};
    customConfigs.forEach(c => {
      if (!configByDate[c.date]) configByDate[c.date] = [];
      configByDate[c.date].push(c);
    });

    // Tổng lương lũy kế của từng người trong kỳ
    const userTotalSalaries = {};
    allUsers.forEach(u => {
      userTotalSalaries[u.id] = 0;
    });

    // Xử lý tính toán cho từng ngày
    const dailyBreakdown = sortedDates.map(dateStr => {
      const dayOrders = allOrders.filter(o => o[filterField] === dateStr);
      const dayExpenses = allExpenses.filter(e => e.date === dateStr);

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const dayCost = dayExpenses.reduce((sum, e) => sum + (e.total_cost || 0), 0);
      const dayProfit = dayRevenue - dayCost;

      const customRows = configByDate[dateStr] || [];
      const isCustom = customRows.length > 0;

      let allocations = [];

      if (isCustom) {
        // Áp dụng cấu hình tùy biến của ngày đó
        allocations = allUsers.map(user => {
          const cfg = customRows.find(c => c.user_id === user.id);
          const isParticipating = cfg ? Boolean(cfg.is_participating) : false;
          const percentage = cfg ? Number(cfg.percentage) || 0 : 0;
          const notes = cfg ? (cfg.notes || '') : '';

          // Lương tính theo tỷ lệ
          const salary = isParticipating ? Math.round(dayProfit * (percentage / 100)) : 0;

          if (isParticipating) {
            userTotalSalaries[user.id] = (userTotalSalaries[user.id] || 0) + salary;
          }

          return {
            userId: user.id,
            userName: user.name,
            avatar: user.avatar,
            role: user.role,
            isParticipating,
            percentage,
            salary,
            notes
          };
        });
      } else {
        // Mặc định: Chia đều cho những người có is_salary_eligible = true
        const defaultEligibleCount = eligibleUsers.length;
        const equalPercentage = defaultEligibleCount > 0 ? Number((100 / defaultEligibleCount).toFixed(2)) : 0;

        allocations = allUsers.map(user => {
          const isParticipating = user.isSalaryEligible;
          const percentage = isParticipating ? equalPercentage : 0;
          const salary = isParticipating ? Math.round(dayProfit * (percentage / 100)) : 0;

          if (isParticipating) {
            userTotalSalaries[user.id] = (userTotalSalaries[user.id] || 0) + salary;
          }

          return {
            userId: user.id,
            userName: user.name,
            avatar: user.avatar,
            role: user.role,
            isParticipating,
            percentage,
            salary,
            notes: ''
          };
        });
      }

      return {
        date: dateStr,
        orderCount: dayOrders.length,
        revenue: dayRevenue,
        cost: dayCost,
        profit: dayProfit,
        isCustom,
        allocations
      };
    });

    // Tổng quan theo từng người
    const userSummaries = allUsers.map(user => {
      const stats = userOrderStats[user.id] || { orderCount: 0, orderTotalAmount: 0 };
      const totalSalary = userTotalSalaries[user.id] || 0;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isSalaryEligible: user.isSalaryEligible,
        orderCount: stats.orderCount,
        orderTotalAmount: stats.orderTotalAmount,
        totalSalary
      };
    });

    // KPI tổng quan cả kỳ
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalCost = allExpenses.reduce((sum, e) => sum + (e.total_cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalSalaryAllocated = Object.values(userTotalSalaries).reduce((sum, s) => sum + s, 0);

    res.json({
      kpis: {
        totalRevenue,
        totalCost,
        totalProfit,
        totalSalaryAllocated,
        totalOrdersCount: allOrders.length,
        activeParticipantsCount: eligibleUsers.length
      },
      userSummaries,
      dailyBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tính toán bảng tổng quan lương: ' + err.message });
  }
});

// POST /api/salary/daily-allocation - Admin lưu tỷ lệ tùy biến cho một ngày cụ thể
router.post('/daily-allocation', (req, res) => {
  try {
    const { date, allocations } = req.body;
    if (!date || !Array.isArray(allocations)) {
      return res.status(400).json({ error: 'Thông tin ngày (date) và danh sách tỷ lệ (allocations) là bắt buộc' });
    }

    const deleteStmt = db.prepare('DELETE FROM daily_salary_config WHERE date = ?');
    const insertStmt = db.prepare(`
      INSERT INTO daily_salary_config (id, date, user_id, percentage, is_participating, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      deleteStmt.run(date);
      for (const item of allocations) {
        if (!item.userId) continue;
        const id = `sal_cfg_${date.replace(/\//g, '')}_${item.userId}`;
        const percentage = parseFloat(item.percentage) || 0;
        const isParticipating = item.isParticipating ? 1 : 0;
        const notes = (item.notes || '').trim();

        insertStmt.run(id, date, item.userId, percentage, isParticipating, notes);
      }
    });

    transaction();

    res.json({
      success: true,
      message: `Đã cập nhật tỷ lệ tính lương cho ngày ${date}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lưu tỷ lệ ngày: ' + err.message });
  }
});

// DELETE /api/salary/daily-allocation/:date - Xóa tùy biến ngày, quay về chia đều mặc định
router.delete('/daily-allocation/:date', (req, res) => {
  try {
    // Ngày có thể gửi định dạng dd-mm-yyyy hoặc dd/mm/yyyy
    let rawDate = decodeURIComponent(req.params.date);
    if (rawDate.includes('-')) {
      rawDate = rawDate.replace(/-/g, '/');
    }

    db.prepare('DELETE FROM daily_salary_config WHERE date = ?').run(rawDate);

    res.json({
      success: true,
      message: `Đã khôi phục chia đều mặc định cho ngày ${rawDate}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khôi phục tỷ lệ mặc định: ' + err.message });
  }
});

module.exports = router;


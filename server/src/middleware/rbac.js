/**
 * middleware/rbac.js - Role-Based Access Control and Granular Screen Permissions
 */

/**
 * Check if the current user has one of the allowed roles
 * @param {string[]} allowedRoles - e.g. ['admin', 'manager']
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập' });
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: 'Quyền truy cập bị từ chối: Chỉ quản trị viên hoặc quản lý mới có quyền thực hiện thao tác này'
    });
  };
}

/**
 * Check if the user has permission to access a specific module/screen
 * - admin & manager always have full access to all modules
 * - staff must have the module key in their permissions array
 * @param {string} screenKey - 'orders' | 'timeline' | 'expenses' | 'dashboard'
 */
function requirePermission(screenKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập' });
    }

    // Dashboard is strictly for admin & manager
    if (screenKey === 'dashboard') {
      if (['admin', 'manager'].includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({
        error: 'Chỉ Admin và Quản trị mới có quyền truy cập Trang tổng quan'
      });
    }

    // Admin & Manager have full access
    if (['admin', 'manager'].includes(req.user.role)) {
      return next();
    }

    // For staff, check screen permission
    if (req.user.role === 'staff') {
      const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
      if (perms.includes(screenKey)) {
        return next();
      }
      return res.status(403).json({
        error: `Bạn chưa được cấp quyền truy cập tính năng: ${screenKey}`
      });
    }

    return res.status(403).json({ error: 'Quyền truy cập không hợp lệ' });
  };
}

module.exports = {
  requireRole,
  requirePermission
};

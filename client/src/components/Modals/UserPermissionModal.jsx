/**
 * components/Modals/UserPermissionModal.jsx
 * Modal for creating, editing, and granularly assigning screen permissions to users
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Shield,
  ShieldCheck,
  ShoppingBag,
  CalendarClock,
  Wallet,
  Check,
  AlertCircle,
  Save,
  UserCheck,
  UserX
} from 'lucide-react';

export default function UserPermissionModal({
  isOpen,
  user,
  currentUser,
  onClose,
  onSave
}) {
  const isEditing = !!user;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [permissions, setPermissions] = useState(['orders', 'timeline']);
  const [status, setStatus] = useState('active');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPassword('');
      setRole(user.role || 'staff');
      setPermissions(Array.isArray(user.permissions) ? user.permissions : ['orders', 'timeline']);
      setStatus(user.status || 'active');
      setErrorMsg('');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      setPermissions(['orders', 'timeline']);
      setStatus('active');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Toggle single screen permission
  const handleTogglePermission = (screenKey) => {
    setPermissions(prev => {
      if (prev.includes(screenKey)) {
        return prev.filter(p => p !== screenKey);
      } else {
        return [...prev, screenKey];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim()) {
      setErrorMsg('Vui lòng nhập Họ tên và Email');
      return;
    }

    if (!isEditing && (!password || password.length < 6)) {
      setErrorMsg('Mật khẩu tạo mới phải từ 6 ký tự trở lên');
      return;
    }

    if (isEditing && password && password.length < 6) {
      setErrorMsg('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    // Role check: Manager cannot create or promote to Admin
    if (currentUser?.role === 'manager' && role === 'admin') {
      setErrorMsg('Quản trị viên không thể phân quyền cấp Admin');
      return;
    }

    // Prevent self-blocking
    if (isEditing && user.id === currentUser?.id && status === 'blocked') {
      setErrorMsg('Bạn không thể tự khóa tài khoản của chính mình');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        role,
        permissions: (role === 'admin' || role === 'manager')
          ? ['orders', 'timeline', 'expenses']
          : permissions,
        status
      };

      if (password.trim()) {
        if (isEditing) {
          payload.newPassword = password.trim();
        } else {
          payload.password = password.trim();
        }
      }

      await onSave(payload, user?.id);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Lỗi lưu thông tin người dùng');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose} id="userPermissionModal">
      <div className="modal-content user-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="modal-icon-badge">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                {isEditing ? 'Phân Quyền & Chỉnh Sửa Thành Viên' : 'Thêm Thành Viên Mới'}
              </h3>
              <p className="modal-subtitle" style={{ margin: '2px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                {isEditing ? `Tài khoản: ${user.email}` : 'Tạo tài khoản và cấp quyền theo từng màn hình'}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Form Body + Footer */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Scrollable Body */}
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Error Alert */}
            {errorMsg && (
              <div className="login-alert error" style={{ margin: 0 }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="modalUserName">Họ và tên</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <User size={18} />
                  </span>
                  <input
                    id="modalUserName"
                    type="text"
                    placeholder="Ví dụ: Hoàng Lan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="modalUserEmail">Email đăng nhập</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="modalUserEmail"
                    type="email"
                    placeholder="lan@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEditing}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="modalUserPassword">
                  {isEditing ? 'Đặt lại mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu khởi tạo'}
                </label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="modalUserPassword"
                    type="password"
                    placeholder={isEditing ? 'Nhập mật khẩu mới nếu muốn đổi' : 'Tối thiểu 6 ký tự'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isEditing}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="form-group" style={{ margin: 0 }}>
                <label>Vai trò trong hệ thống</label>
                <div className="role-options-group">
                  <button
                    type="button"
                    id="roleBtn_staff"
                    className={`role-select-chip ${role === 'staff' ? 'active' : ''}`}
                    onClick={() => setRole('staff')}
                  >
                    <User size={16} />
                    <span>Nhân viên</span>
                  </button>
                  <button
                    type="button"
                    id="roleBtn_manager"
                    className={`role-select-chip ${role === 'manager' ? 'active' : ''}`}
                    onClick={() => setRole('manager')}
                  >
                    <Shield size={16} />
                    <span>Quản trị</span>
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      id="roleBtn_admin"
                      className={`role-select-chip ${role === 'admin' ? 'active' : ''}`}
                      onClick={() => setRole('admin')}
                    >
                      <ShieldCheck size={16} />
                      <span>Admin</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Granular Screen Permissions Section */}
            <div className="permissions-config-box">
              <div className="permissions-header">
                <span className="title">Quyền truy cập các màn hình</span>
                <span className="note">
                  {role === 'admin' || role === 'manager'
                    ? 'Admin & Quản trị có toàn quyền truy cập tất cả màn hình (bao gồm Tổng quan).'
                    : 'Trang Tổng quan chỉ dành riêng cho Admin/Quản trị. Tích chọn các màn hình nhân viên được phép truy cập:'}
                </span>
              </div>

              <div className="screens-permission-list">
                {/* Screen 1: Orders */}
                <div
                  id="permItem_orders"
                  role="checkbox"
                  aria-checked={role === 'admin' || role === 'manager' || permissions.includes('orders')}
                  className={`permission-item-card ${(role === 'admin' || role === 'manager' || permissions.includes('orders')) ? 'selected' : ''}`}
                  onClick={() => role === 'staff' && handleTogglePermission('orders')}
                  style={{ cursor: role === 'staff' ? 'pointer' : 'default' }}
                >
                  <div className="checkbox-box">
                    {(role === 'admin' || role === 'manager' || permissions.includes('orders')) && <Check size={14} />}
                  </div>
                  <div className="item-icon">
                    <ShoppingBag size={18} />
                  </div>
                  <div className="item-info">
                    <strong>Màn hình Đơn Hàng</strong>
                    <p>Xem danh sách, thêm/sửa đơn hoa, cập nhật trạng thái đơn</p>
                  </div>
                </div>

                {/* Screen 2: Timeline */}
                <div
                  id="permItem_timeline"
                  role="checkbox"
                  aria-checked={role === 'admin' || role === 'manager' || permissions.includes('timeline')}
                  className={`permission-item-card ${(role === 'admin' || role === 'manager' || permissions.includes('timeline')) ? 'selected' : ''}`}
                  onClick={() => role === 'staff' && handleTogglePermission('timeline')}
                  style={{ cursor: role === 'staff' ? 'pointer' : 'default' }}
                >
                  <div className="checkbox-box">
                    {(role === 'admin' || role === 'manager' || permissions.includes('timeline')) && <Check size={14} />}
                  </div>
                  <div className="item-icon">
                    <CalendarClock size={18} />
                  </div>
                  <div className="item-info">
                    <strong>Màn hình Tiến Độ Cắm Hoa</strong>
                    <p>Xem tiến độ theo khung giờ hẹn lấy, cập nhật hoa đã cắm xong</p>
                  </div>
                </div>

                {/* Screen 3: Expenses */}
                <div
                  id="permItem_expenses"
                  role="checkbox"
                  aria-checked={role === 'admin' || role === 'manager' || permissions.includes('expenses')}
                  className={`permission-item-card ${(role === 'admin' || role === 'manager' || permissions.includes('expenses')) ? 'selected' : ''}`}
                  onClick={() => role === 'staff' && handleTogglePermission('expenses')}
                  style={{ cursor: role === 'staff' ? 'pointer' : 'default' }}
                >
                  <div className="checkbox-box">
                    {(role === 'admin' || role === 'manager' || permissions.includes('expenses')) && <Check size={14} />}
                  </div>
                  <div className="item-icon">
                    <Wallet size={18} />
                  </div>
                  <div className="item-info">
                    <strong>Màn hình Vốn &amp; Chi Phí</strong>
                    <p>Quản lý chi phí nhập hoa, phụ liệu và chi phí cửa hàng</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status Toggle */}
            <div className="status-config-box">
              <span className="label">Trạng thái tài khoản:</span>
              <div className="status-buttons">
                <button
                  type="button"
                  id="statusBtn_active"
                  className={`status-btn ${status === 'active' ? 'active-green' : ''}`}
                  onClick={() => setStatus('active')}
                >
                  <UserCheck size={16} />
                  <span>Hoạt động</span>
                </button>
                <button
                  type="button"
                  id="statusBtn_blocked"
                  className={`status-btn ${status === 'blocked' ? 'blocked-red' : ''}`}
                  onClick={() => setStatus('blocked')}
                  disabled={isEditing && user.id === currentUser?.id}
                  title={isEditing && user.id === currentUser?.id ? 'Không thể tự khóa tài khoản của bạn' : ''}
                >
                  <UserX size={16} />
                  <span>Khóa tài khoản</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer (Pinned at Bottom) */}
          <div className="modal-footer" style={{ flexShrink: 0, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-muted)', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" id="btnSubmitPermissions" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Đang lưu...' : isEditing ? 'Cập Nhật Quyền' : 'Tạo Tài Khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

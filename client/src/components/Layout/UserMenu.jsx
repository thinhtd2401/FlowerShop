/**
 * components/Layout/UserMenu.jsx - User Profile dropdown & Logout for Header
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Users,
  ShieldCheck,
  Shield,
  Key,
  LogOut,
  ChevronDown,
  X,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api';

export default function UserMenu({ onNavigateToUsers }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Password modal states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Lỗi đổi mật khẩu');
    } finally {
      setSavingPassword(false);
    }
  };

  const isManagerOrAdmin = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button
        type="button"
        id="userMenuTriggerBtn"
        className="user-menu-trigger-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="Menu tài khoản"
      >
        <div className="user-avatar-small">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>
        <div className="user-name-role-col">
          <span className="user-name-text">{user.name}</span>
          <span className={`user-role-text ${user.role}`}>
            {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Quản trị' : 'Nhân viên'}
          </span>
        </div>
        <ChevronDown size={14} className={`chevron-icon ${dropdownOpen ? 'rotate' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="user-dropdown-popover">
          <div className="user-popover-header">
            <span className="header-name">{user.name}</span>
            <span className="header-email">{user.email}</span>
            <div className="header-role-badge">
              {user.role === 'admin' && <ShieldCheck size={12} />}
              {user.role === 'manager' && <Shield size={12} />}
              {user.role === 'staff' && <User size={12} />}
              <span>{user.role === 'admin' ? 'Admin Cấp Cao' : user.role === 'manager' ? 'Quản Trị Viên' : 'Nhân Viên Tiệm'}</span>
            </div>
          </div>

          <div className="user-popover-menu">
            {isManagerOrAdmin && onNavigateToUsers && (
              <button
                type="button"
                id="menuNavUsers"
                className="popover-menu-item"
                onClick={() => {
                  setDropdownOpen(false);
                  onNavigateToUsers();
                }}
              >
                <Users size={16} />
                <span>Quản lý thành viên &amp; Phân quyền</span>
              </button>
            )}

            <button
              type="button"
              id="menuChangePassword"
              className="popover-menu-item"
              onClick={() => {
                setDropdownOpen(false);
                setPasswordModalOpen(true);
              }}
            >
              <Key size={16} />
              <span>Đổi mật khẩu</span>
            </button>

            <div className="popover-divider"></div>

            <button
              type="button"
              id="menuLogoutBtn"
              className="popover-menu-item logout"
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="modal-overlay active" id="changePasswordModal" onClick={() => setPasswordModalOpen(false)}>
          <div className="modal-content password-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <span className="modal-icon-badge">
                  <Key size={20} />
                </span>
                <div>
                  <h3>Đổi Mật Khẩu</h3>
                  <p className="modal-subtitle">Tài khoản: {user.email}</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPasswordModalOpen(false)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {passwordError && (
              <div className="login-alert error" style={{ margin: '16px 24px 0' }}>
                <AlertCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="login-alert success" style={{ margin: '16px 24px 0' }}>
                <CheckCircle2 size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="modal-body-form">
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPasswordModalOpen(false)}
                  disabled={savingPassword}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPassword}
                >
                  <Save size={16} />
                  <span>{savingPassword ? 'Đang lưu...' : 'Lưu Mật Khẩu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

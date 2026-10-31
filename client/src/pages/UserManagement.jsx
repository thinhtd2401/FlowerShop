/**
 * pages/UserManagement.jsx - User Management & Screen Permission Assignment
 * Accessible only by Admin & Manager
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  User,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  CalendarClock,
  Wallet,
  Loader2,
  Lock,
  Mail,
  DollarSign
} from 'lucide-react';
import { usersApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import UserPermissionModal from '../components/Modals/UserPermissionModal';

export default function UserManagement({ showToast }) {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'manager' | 'staff'
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data || []);
    } catch (err) {
      showToast?.(err.response?.data?.error || 'Lỗi tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  // Handle save user (create or update)
  const handleSaveUser = async (formData, userId) => {
    try {
      if (userId) {
        await usersApi.update(userId, formData);
        showToast?.('Cập nhật phân quyền thành công!', 'success');
      } else {
        await usersApi.create(formData);
        showToast?.('Tạo người dùng mới thành công!', 'success');
      }
      fetchUsers();
    } catch (err) {
      throw err;
    }
  };

  // Handle delete user (Admin only)
  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${userEmail}?`)) {
      return;
    }

    try {
      await usersApi.delete(userId);
      showToast?.('Đã xóa người dùng thành công', 'info');
      fetchUsers();
    } catch (err) {
      showToast?.(err.response?.data?.error || 'Lỗi xóa người dùng', 'error');
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'all' || u.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Statistics
  const adminCount = users.filter(u => u.role === 'admin').length;
  const managerCount = users.filter(u => u.role === 'manager').length;
  const staffCount = users.filter(u => u.role === 'staff').length;

  return (
    <div className="users-page-wrapper">
      {/* Top Bar with KPI Pills & Add Button */}
      <div className="users-top-bar">
        <div className="users-stat-pills">
          <div className="stat-pill active">
            <Users size={16} />
            <span>Tất cả: <strong>{users.length}</strong></span>
          </div>
          <div className="stat-pill admin">
            <ShieldCheck size={16} />
            <span>Admin: <strong>{adminCount}</strong></span>
          </div>
          <div className="stat-pill manager">
            <Shield size={16} />
            <span>Quản trị: <strong>{managerCount}</strong></span>
          </div>
          <div className="stat-pill staff">
            <User size={16} />
            <span>Nhân viên: <strong>{staffCount}</strong></span>
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <UserPlus size={16} />
          <span>Thêm thành viên</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="users-filter-bar">
        <div className="users-search-input">
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="role-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`filter-tab ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter('admin')}
          >
            Admin
          </button>
          <button
            type="button"
            className={`filter-tab ${roleFilter === 'manager' ? 'active' : ''}`}
            onClick={() => setRoleFilter('manager')}
          >
            Quản trị
          </button>
          <button
            type="button"
            className={`filter-tab ${roleFilter === 'staff' ? 'active' : ''}`}
            onClick={() => setRoleFilter('staff')}
          >
            Nhân viên
          </button>
        </div>
      </div>

      {/* Users Content */}
      {loading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={24} />
          <span>Đang tải danh sách thành viên...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} color="var(--text-light)" />
          <h4>Không tìm thấy người dùng phù hợp</h4>
          <p>Thử tìm kiếm với từ khóa khác hoặc thêm thành viên mới</p>
        </div>
      ) : (
        <div className="users-list-container">
          {/* Desktop Table View */}
          <div className="desktop-users-table-card">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Vai trò</th>
                  <th>Quyền xem màn hình</th>
                  <th>Trạng thái</th>
                  <th>Đăng nhập gần nhất</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isSelf = u.id === currentUser?.id;
                  const perms = Array.isArray(u.permissions) ? u.permissions : [];

                  return (
                    <tr key={u.id} className={u.status === 'blocked' ? 'row-blocked' : ''}>
                      <td>
                        <div className="user-profile-cell">
                          <div className="user-avatar-circle">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} />
                            ) : (
                              <span>{u.name?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <div className="user-info-text">
                            <span className="user-name">
                              {u.name}
                              {isSelf && <span className="self-tag">(Bạn)</span>}
                            </span>
                            <span className="user-email">
                              <Mail size={12} />
                              {u.email}
                            </span>
                            {u.isSalaryEligible && (
                              <span style={{ fontSize: 10.5, background: 'var(--status-completed-bg)', color: 'var(--status-completed-text)', border: '1px solid var(--status-completed-border)', padding: '1px 6px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4, width: 'fit-content' }}>
                                <DollarSign size={10} /> Tính lương
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role === 'admin' && <ShieldCheck size={13} />}
                          {u.role === 'manager' && <Shield size={13} />}
                          {u.role === 'staff' && <User size={13} />}
                          <span>
                            {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Quản trị' : 'Nhân viên'}
                          </span>
                        </span>
                      </td>

                      <td>
                        {u.role === 'admin' || u.role === 'manager' ? (
                          <span className="all-perms-pill">
                            <ShieldCheck size={13} />
                            <span>Toàn quyền (Tất cả màn hình)</span>
                          </span>
                        ) : (
                          <div className="screen-badges-list">
                            {perms.includes('orders') && (
                              <span className="screen-badge orders">
                                <ShoppingBag size={12} />
                                <span>Đơn hàng</span>
                              </span>
                            )}
                            {perms.includes('timeline') && (
                              <span className="screen-badge timeline">
                                <CalendarClock size={12} />
                                <span>Tiến độ cắm</span>
                              </span>
                            )}
                            {perms.includes('expenses') && (
                              <span className="screen-badge expenses">
                                <Wallet size={12} />
                                <span>Vốn &amp; Chi phí</span>
                              </span>
                            )}
                            {perms.length === 0 && (
                              <span className="screen-badge none">Chưa cấp quyền</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className={`status-pill-badge ${u.status}`}>
                          {u.status === 'active' ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={13} />
                              <span>Đã khóa</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="last-login-text">
                          {u.lastLoginAt ? u.lastLoginAt.slice(0, 16) : 'Chưa đăng nhập'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="user-actions-btns">
                          <button
                            type="button"
                            id={`btnEditUser_${u.id}`}
                            className="btn-action edit"
                            onClick={() => handleOpenEdit(u)}
                            title="Phân quyền &amp; Sửa thông tin"
                          >
                            <Edit3 size={15} />
                            <span>Phân quyền</span>
                          </button>
                          {currentUser?.role === 'admin' && !isSelf && u.email !== 'admin@khflowershop.vn' && (
                            <button
                              type="button"
                              className="btn-action delete"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              title="Xóa người dùng"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-users-cards">
            {filteredUsers.map(u => {
              const isSelf = u.id === currentUser?.id;
              const perms = Array.isArray(u.permissions) ? u.permissions : [];

              return (
                <div key={u.id} className={`user-mobile-card ${u.status === 'blocked' ? 'blocked' : ''}`}>
                  <div className="card-top">
                    <div className="user-avatar-circle">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} />
                      ) : (
                        <span>{u.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div className="user-card-header-info">
                      <div className="name-row">
                        <h4>{u.name}</h4>
                        {isSelf && <span className="self-tag">Bạn</span>}
                      </div>
                      <span className="card-email">{u.email}</span>
                      {u.isSalaryEligible && (
                        <span style={{ fontSize: 10.5, background: 'var(--status-completed-bg)', color: 'var(--status-completed-text)', border: '1px solid var(--status-completed-border)', padding: '1px 6px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3, width: 'fit-content' }}>
                          <DollarSign size={10} /> Tính lương
                        </span>
                      )}
                    </div>
                    <span className={`role-badge ${u.role}`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Quản trị' : 'Nhân viên'}
                    </span>
                  </div>

                  <div className="card-permissions-section">
                    <span className="section-label">Quyền màn hình:</span>
                    {u.role === 'admin' || u.role === 'manager' ? (
                      <span className="all-perms-pill">
                        <ShieldCheck size={13} />
                        <span>Toàn quyền tất cả màn hình</span>
                      </span>
                    ) : (
                      <div className="screen-badges-list">
                        {perms.includes('orders') && (
                          <span className="screen-badge orders">
                            <ShoppingBag size={12} />
                            <span>Đơn hàng</span>
                          </span>
                        )}
                        {perms.includes('timeline') && (
                          <span className="screen-badge timeline">
                            <CalendarClock size={12} />
                            <span>Tiến độ cắm</span>
                          </span>
                        )}
                        {perms.includes('expenses') && (
                          <span className="screen-badge expenses">
                            <Wallet size={12} />
                            <span>Vốn &amp; Chi phí</span>
                          </span>
                        )}
                        {perms.length === 0 && (
                          <span className="screen-badge none">Chưa cấp quyền</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="card-footer-row">
                    <span className={`status-pill-badge ${u.status}`}>
                      {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>

                    <div className="card-action-btns">
                      <button
                        type="button"
                        id={`btnEditUserMobile_${u.id}`}
                        className="btn-action edit"
                        onClick={() => handleOpenEdit(u)}
                      >
                        <Edit3 size={14} />
                        <span>Phân quyền</span>
                      </button>
                      {currentUser?.role === 'admin' && !isSelf && u.email !== 'admin@khflowershop.vn' && (
                        <button
                          type="button"
                          className="btn-action delete"
                          onClick={() => handleDeleteUser(u.id, u.email)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Permission & Edit Modal */}
      <UserPermissionModal
        isOpen={modalOpen}
        user={selectedUser}
        currentUser={currentUser}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
      />
    </div>
  );
}

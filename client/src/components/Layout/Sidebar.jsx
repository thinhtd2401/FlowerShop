/**
 * components/Layout/Sidebar.jsx - RBAC-Aware Navigation Sidebar
 */
import React from 'react';
import {
  Flower2,
  LayoutDashboard,
  ShoppingBag,
  CalendarClock,
  Wallet,
  DollarSign,
  Users,
  ShieldCheck,
  Shield,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ currentView, onNavigate, totalOrdersCount, pendingCount }) {
  const { user, hasPermission, logout } = useAuth();
  const orderCount = totalOrdersCount ?? pendingCount ?? 0;

  // Master navigation list
  const allNavItems = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { key: 'orders', icon: ShoppingBag, label: 'Đơn hàng', badge: orderCount > 0 ? orderCount : null },
    { key: 'timeline', icon: CalendarClock, label: 'Tiến độ cắm hoa' },
    { key: 'expenses', icon: Wallet, label: 'Vốn & Chi phí' },
    { key: 'salary', icon: DollarSign, label: 'Quản lý lương' },
    { key: 'users', icon: Users, label: 'Quản lý thành viên' },
  ];

  // Filter based on user's specific RBAC permissions
  const navItems = allNavItems.filter(item => hasPermission(item.key));

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-logo">
          <Flower2 size={24} color="#ffffff" />
        </div>
        <div className="brand-info">
          <h1>KHflower Shop</h1>
          <p>Quản lý Đơn &amp; Vốn</p>
        </div>
      </div>

      <nav className="nav-menu">
        {navItems.map(item => {
          const IconComponent = item.icon;
          return (
            <button
              type="button"
              key={item.key}
              id={`nav_${item.key}`}
              className={`nav-item ${currentView === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
              data-view={item.key}
            >
              <span className="icon">
                <IconComponent size={18} />
              </span>
              <span>{item.label}</span>
              {item.badge && <span className="badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user-pill">
            <div className="user-avatar-tiny">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="name">{user.name}</span>
              <span className={`role ${user.role}`}>
                {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Quản trị' : 'Nhân viên'}
              </span>
            </div>
            <button
              type="button"
              className="sidebar-logout-icon"
              onClick={logout}
              title="Đăng xuất tài khoản"
              aria-label="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        <div className="store-status-pill">
          <span className="pulse-dot"></span>
          <span>Đang mở cửa • Dịp 20/10</span>
        </div>
      </div>
    </aside>
  );
}

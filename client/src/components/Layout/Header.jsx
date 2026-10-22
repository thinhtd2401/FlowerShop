/**
 * components/Layout/Header.jsx - App Top Header with User Profile & RBAC Action Controls
 */
import React from 'react';
import {
  Flower2,
  Search,
  FileSpreadsheet,
  PlusCircle,
  Plus,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserMenu from './UserMenu';

export default function Header({
  currentView,
  onNavigate,
  onSearch,
  onAddOrder,
  onAddExpense,
  onExportExcel,
  theme = 'light',
  onToggleTheme,
  sidebarCollapsed = false,
  onToggleSidebar
}) {
  const { hasPermission } = useAuth();

  const titles = {
    dashboard: { title: 'Tổng Quan Kinh Doanh', subtitle: 'Theo dõi doanh thu, chi phí vốn và tiến độ đơn hàng' },
    orders: { title: 'Quản Lý Đơn Hàng', subtitle: 'Theo dõi và xử lý tất cả đơn đặt hoa' },
    timeline: { title: 'Tiến Độ Cắm Hoa', subtitle: 'Lịch cắm và giao hoa theo ngày & khung giờ' },
    expenses: { title: 'Vốn & Chi Phí', subtitle: 'Quản lý chi phí nhập hàng và vật tư' },
    users: { title: 'Quản Lý Thành Viên & Phân Quyền', subtitle: 'Phân quyền chi tiết cho nhân viên theo từng màn hình nghiệp vụ' },
  };

  const { title, subtitle } = titles[currentView] || titles.dashboard;

  const canAddOrder = hasPermission('orders');
  const canAddExpense = hasPermission('expenses');

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Sidebar Toggle for Laptop & Tablet */}
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Hiện thanh menu bên trái' : 'Ẩn thanh menu bên trái'}
          aria-label="Ẩn hiện thanh menu bên trái"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </button>

        <div className="header-mobile-brand">
          <div className="logo">
            <Flower2 size={20} color="#ffffff" />
          </div>
          <div className="title">KHflower Shop</div>
        </div>
        <div className="header-title-wrapper">
          <h2 id="pageTitle">{title}</h2>
          <span className="header-subtitle" id="pageSubtitle">{subtitle}</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Search Bar - Hidden on Users view */}
        {currentView !== 'users' && (
          <div className="search-box">
            <span className="search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              id="globalSearch"
              placeholder="Tìm tên khách, SĐT, mẫu hoa..."
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}

        {/* Theme Toggle (Dark / Light) */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          aria-label="Đổi giao diện Sáng / Tối"
        >
          {theme === 'dark' ? (
            <Sun size={18} color="#f59e0b" />
          ) : (
            <Moon size={18} color="var(--text-muted)" />
          )}
        </button>

        {/* Excel Export: Hidden on Dashboard and Users view */}
        {currentView !== 'dashboard' && currentView !== 'users' && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onExportExcel}
            title="Xuất file báo cáo Excel (.xlsx 3 Sheet)"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Excel</span>
          </button>
        )}

        {/* Add Expense Button - Protected by 'expenses' permission */}
        {canAddExpense && (
          <button
            id="btnAddExpense"
            className="btn btn-outline-primary"
            onClick={onAddExpense}
            title="Thêm khoản chi phí vốn"
          >
            <PlusCircle size={16} />
            <span>Chi phí</span>
          </button>
        )}

        {/* Add Order Button - Protected by 'orders' permission */}
        {canAddOrder && (
          <button
            id="btnAddOrder"
            className="btn btn-primary"
            onClick={onAddOrder}
            title="Tạo đơn hàng mới"
          >
            <Plus size={16} />
            <span>Tạo đơn mới</span>
          </button>
        )}

        {/* User Profile & Logout Menu */}
        <UserMenu onNavigateToUsers={() => onNavigate?.('users')} />
      </div>
    </header>
  );
}

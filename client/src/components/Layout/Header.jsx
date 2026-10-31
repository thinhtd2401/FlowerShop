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
    salary: { title: 'Quản Lý & Bảng Tính Lương', subtitle: 'Phân chia lợi nhuận theo tỷ lệ ngày & thống kê đơn xử lý' },
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

        <div className="view-title">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Quick Search */}
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            id="searchInput"
            placeholder="Tìm đơn, khách, SĐT..."
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        {/* Export Excel Button (Only for views with orders or expenses) */}
        {(currentView === 'orders' || currentView === 'dashboard') && (
          <button
            type="button"
            id="btnExportExcel"
            className="btn btn-secondary btn-icon-mobile"
            onClick={onExportExcel}
            title="Xuất dữ liệu ra file Excel"
          >
            <FileSpreadsheet size={16} />
            <span className="btn-text">Xuất Excel</span>
          </button>
        )}

        {/* Create Expense (Only if user has expenses permission) */}
        {canAddExpense && (currentView === 'expenses' || currentView === 'dashboard') && (
          <button
            type="button"
            id="btnOpenExpenseModal"
            className="btn btn-secondary btn-icon-mobile"
            onClick={onAddExpense}
            title="Ghi nhận khoản chi phí hoặc tiền nhập hoa mới"
          >
            <PlusCircle size={16} />
            <span className="btn-text">Thêm Chi Phí</span>
          </button>
        )}

        {/* Create Order (Only if user has orders permission) */}
        {canAddOrder && (
          <button
            type="button"
            id="btnOpenOrderModal"
            className="btn btn-primary"
            onClick={onAddOrder}
            title="Lên đơn đặt hoa mới"
          >
            <Plus size={16} />
            <span>Tạo Đơn Mới</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          id="btnToggleTheme"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          aria-label="Đổi giao diện"
        >
          {theme === 'dark' ? (
            <Sun size={17} className="theme-icon sun" />
          ) : (
            <Moon size={17} className="theme-icon moon" />
          )}
        </button>

        {/* User Profile & Menu */}
        <UserMenu onNavigate={onNavigate} />
      </div>
    </header>
  );
}

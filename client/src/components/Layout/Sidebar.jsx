/**
 * components/Layout/Sidebar.jsx
 */
import { Flower2, LayoutDashboard, ShoppingBag, CalendarClock, Wallet } from 'lucide-react';

export default function Sidebar({ currentView, onNavigate, totalOrdersCount, pendingCount }) {
  const orderCount = totalOrdersCount ?? pendingCount ?? 0;
  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { key: 'orders', icon: ShoppingBag, label: 'Đơn hàng', badge: orderCount > 0 ? orderCount : null },
    { key: 'timeline', icon: CalendarClock, label: 'Tiến độ cắm hoa' },
    { key: 'expenses', icon: Wallet, label: 'Vốn & Chi phí' },
  ];

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
              key={item.key}
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
        <div className="store-status-pill" style={{ marginBottom: 12 }}>
          <span className="pulse-dot"></span>
          <span>Đang mở cửa • Dịp 20/10</span>
        </div>
      </div>
    </aside>
  );
}

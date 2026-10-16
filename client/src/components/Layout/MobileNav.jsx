/**
 * components/Layout/MobileNav.jsx
 */
import { LayoutDashboard, ShoppingBag, CalendarClock, Wallet } from 'lucide-react';

export default function MobileNav({ currentView, onNavigate }) {
  const items = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { key: 'orders', icon: ShoppingBag, label: 'Đơn hàng' },
    { key: 'timeline', icon: CalendarClock, label: 'Tiến độ' },
    { key: 'expenses', icon: Wallet, label: 'Vốn' },
  ];

  return (
    <div className="mobile-nav-bar">
      {items.map(item => {
        const IconComponent = item.icon;
        return (
          <button
            key={item.key}
            className={`mobile-nav-item ${currentView === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
            data-view={item.key}
          >
            <span className="icon">
              <IconComponent size={20} />
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

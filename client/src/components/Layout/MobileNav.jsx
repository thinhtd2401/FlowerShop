/**
 * components/Layout/MobileNav.jsx - RBAC-Aware Bottom Navigation for Mobile
 */
import React from 'react';
import { LayoutDashboard, ShoppingBag, CalendarClock, Wallet, DollarSign, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function MobileNav({ currentView, onNavigate }) {
  const { hasPermission } = useAuth();

  const allItems = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { key: 'orders', icon: ShoppingBag, label: 'Đơn hàng' },
    { key: 'timeline', icon: CalendarClock, label: 'Tiến độ' },
    { key: 'expenses', icon: Wallet, label: 'Vốn' },
    { key: 'salary', icon: DollarSign, label: 'Lương' },
    { key: 'users', icon: Users, label: 'Thành viên' },
  ];

  const items = allItems.filter(item => hasPermission(item.key));

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

/**
 * App.jsx - Root component with authentication, RBAC layout, routing, and state management
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import MobileNav from './components/Layout/MobileNav';
import OrderModal from './components/Modals/OrderModal';
import ExpenseModal from './components/Modals/ExpenseModal';
import ImageGalleryModal from './components/UI/ImageGalleryModal';
import { ToastContainer, useToast } from './components/UI/Toast';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Timeline from './pages/Timeline';
import Expenses from './pages/Expenses';
import SalaryManagement from './pages/SalaryManagement';
import UserManagement from './pages/UserManagement';
import LoginPage from './pages/LoginPage';
import { useAuth } from './hooks/useAuth';
import { useOrders } from './hooks/useOrders';
import { useExpenses } from './hooks/useExpenses';
import { exportToExcel } from './utils/exportExcel';
import {
  shouldAutoRestoreOrderModal,
  setOrderModalOpenFlag,
  clearOrderDraft
} from './utils/orderDraft';

export default function App() {
  const { user, isAuthenticated, loading: authLoading, hasPermission, getDefaultScreen } = useAuth();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState(() => {
    try {
      const stored = localStorage.getItem('flowershop_user');
      const u = stored ? JSON.parse(stored) : null;
      if (u?.role === 'admin' || u?.role === 'manager') return 'dashboard';
      if (u?.permissions?.includes('orders')) return 'orders';
      if (u?.permissions?.includes('timeline')) return 'timeline';
    } catch {}
    return 'orders';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(() => {
    return shouldAutoRestoreOrderModal();
  });
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [galleryState, setGalleryState] = useState({ isOpen: false, order: null, initialIndex: 0 });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('flowershop_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('flowershop_theme', theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('floral_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('floral_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // Update default view only when authentication status or user role changes
  useEffect(() => {
    if (isAuthenticated) {
      if (!hasPermission(currentView)) {
        setCurrentView(getDefaultScreen());
      }
    }
  }, [isAuthenticated, user?.id, user?.role, JSON.stringify(user?.permissions)]);

  // Screen permission flags for API hooks
  const canViewOrders = hasPermission('orders') || hasPermission('timeline') || hasPermission('dashboard');
  const canViewExpenses = hasPermission('expenses') || hasPermission('dashboard');

  const { orders, loading: ordersLoading, createOrder, updateOrder, updateStatus, updateImages, deleteOrder } = useOrders(canViewOrders);
  const { expenses, loading: expensesLoading, createExpense, updateExpense, deleteExpense } = useExpenses(canViewExpenses);

  const handleExportExcel = useCallback(() => {
    try {
      exportToExcel(orders, expenses);
      showToast('Đang tải file Excel báo cáo...', 'success');
    } catch {
      showToast('Lỗi khi xuất file Excel', 'error');
    }
  }, [orders, expenses, showToast]);

  const handleOpenAddOrder = useCallback(() => {
    setEditingOrder(null);
    setOrderModalOpen(true);
    setOrderModalOpenFlag(true);
  }, []);

  const handleCloseOrderModal = useCallback(() => {
    setOrderModalOpen(false);
    setEditingOrder(null);
    setOrderModalOpenFlag(false);
  }, []);

  const handleEditOrder = useCallback((order) => {
    setEditingOrder(order);
    setOrderModalOpen(true);
    setOrderModalOpenFlag(true);
  }, []);

  const handleOpenAddExpense = useCallback(() => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  }, []);

  const handleEditExpense = useCallback((expense) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  }, []);

  const handleSaveOrder = useCallback(async (formData) => {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, formData);
        showToast('Cập nhật đơn hàng thành công!', 'success');
      } else {
        await createOrder(formData);
        showToast('Tạo đơn hàng mới thành công!', 'success');
        clearOrderDraft();
      }
      setRefreshTrigger(prev => prev + 1);
    } catch {
      showToast('Có lỗi xảy ra. Vui lòng thử lại!', 'error');
    }
  }, [editingOrder, createOrder, updateOrder, showToast]);

  const handleUpdateStatus = useCallback(async (id, status) => {
    try {
      await updateStatus(id, status);
      showToast('Cập nhật trạng thái thành công!', 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch {
      showToast('Lỗi cập nhật trạng thái', 'error');
    }
  }, [updateStatus, showToast]);

  const handleDeleteOrder = useCallback(async (id) => {
    try {
      await deleteOrder(id);
      showToast('Đã xóa đơn hàng', 'info');
      setRefreshTrigger(prev => prev + 1);
    } catch {
      showToast('Lỗi xóa đơn hàng', 'error');
    }
  }, [deleteOrder, showToast]);

  const handleSaveExpense = useCallback(async (formData) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData);
        showToast('Cập nhật khoản chi phí thành công!', 'success');
      } else {
        await createExpense(formData);
        showToast('Thêm khoản chi phí thành công!', 'success');
      }
      setRefreshTrigger(prev => prev + 1);
    } catch {
      showToast('Có lỗi xảy ra. Vui lòng thử lại!', 'error');
    }
  }, [editingExpense, createExpense, updateExpense, showToast]);

  const handleDeleteExpense = useCallback(async (id) => {
    try {
      await deleteExpense(id);
      showToast('Đã xóa khoản chi phí', 'info');
      setRefreshTrigger(prev => prev + 1);
    } catch {
      showToast('Lỗi xóa chi phí', 'error');
    }
  }, [deleteExpense, showToast]);

  const handleOpenGallery = useCallback(({ order, initialIndex = 0 }) => {
    setGalleryState({ isOpen: true, order, initialIndex });
  }, []);

  const handleCloseGallery = useCallback(() => {
    setGalleryState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleUpdateOrderImages = useCallback(async (orderId, newImages) => {
    try {
      const updated = await updateImages(orderId, newImages);
      setGalleryState(prev => prev.order?.id === orderId ? { ...prev, order: updated } : prev);
      showToast('Đã cập nhật ảnh mẫu hoa!', 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch {
      showToast('Lỗi cập nhật ảnh mẫu', 'error');
    }
  }, [updateImages, showToast]);

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg-app)' }}>
        <Loader2 className="animate-spin" size={36} color="var(--primary)" />
        <span style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 500 }}>
          Đang khởi động hệ thống KHflower Shop...
        </span>
      </div>
    );
  }

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const renderCurrentView = () => {
    if (ordersLoading && (currentView === 'orders' || currentView === 'timeline')) {
      return (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Loader2 className="animate-spin" size={24} color="var(--primary)" />
          <span>Đang tải dữ liệu đơn hàng...</span>
        </div>
      );
    }

    if (expensesLoading && currentView === 'expenses') {
      return (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Loader2 className="animate-spin" size={24} color="var(--primary)" />
          <span>Đang tải dữ liệu chi phí...</span>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        if (!hasPermission('dashboard')) return null;
        return <Dashboard onNavigate={setCurrentView} refreshTrigger={refreshTrigger} />;
      case 'orders':
        if (!hasPermission('orders')) return null;
        return (
          <Orders
            orders={orders}
            searchQuery={searchQuery}
            onEditOrder={handleEditOrder}
            onUpdateStatus={handleUpdateStatus}
            onDeleteOrder={handleDeleteOrder}
            onOpenGallery={handleOpenGallery}
          />
        );
      case 'timeline':
        if (!hasPermission('timeline')) return null;
        return (
          <Timeline
            orders={orders}
            onUpdateStatus={handleUpdateStatus}
            onOpenGallery={handleOpenGallery}
          />
        );
      case 'expenses':
        if (!hasPermission('expenses')) return null;
        return (
          <Expenses
            expenses={expenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        );
      case 'salary':
        if (!hasPermission('salary')) return null;
        return <SalaryManagement showToast={showToast} />;
      case 'users':
        if (!hasPermission('users')) return null;
        return <UserManagement showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        totalOrdersCount={orders.filter(o => o.status !== 'cancelled').length}
      />

      <div className="main-wrapper">
        <Header
          currentView={currentView}
          onNavigate={setCurrentView}
          onSearch={setSearchQuery}
          onAddOrder={handleOpenAddOrder}
          onAddExpense={handleOpenAddExpense}
          onExportExcel={handleExportExcel}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="page-container">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav currentView={currentView} onNavigate={setCurrentView} />

      {/* Mobile FAB - Only visible if has orders permission */}
      {hasPermission('orders') && (
        <button className="mobile-fab" id="mobileFabOrder" onClick={handleOpenAddOrder} title="Tạo đơn hàng mới">
          <Plus size={18} />
          <span>Tạo đơn</span>
        </button>
      )}

      {/* Modals */}
      <OrderModal
        isOpen={orderModalOpen}
        order={editingOrder}
        onClose={handleCloseOrderModal}
        onSave={handleSaveOrder}
        onDelete={handleDeleteOrder}
      />
      <ExpenseModal
        isOpen={expenseModalOpen}
        expense={editingExpense}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
      />
      <ImageGalleryModal
        isOpen={galleryState.isOpen}
        order={galleryState.order}
        initialIndex={galleryState.initialIndex}
        onClose={handleCloseGallery}
        onUpdateImages={handleUpdateOrderImages}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

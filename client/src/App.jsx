/**
 * App.jsx - Root component with layout, routing, and state management
 */
import { useState, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import MobileNav from './components/Layout/MobileNav';
import OrderModal from './components/Modals/OrderModal';
import ExpenseModal from './components/Modals/ExpenseModal';
import { ToastContainer, useToast } from './components/UI/Toast';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Timeline from './pages/Timeline';
import Expenses from './pages/Expenses';
import { useOrders } from './hooks/useOrders';
import { useExpenses } from './hooks/useExpenses';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { showToast } = useToast();
  const { orders, loading: ordersLoading, createOrder, updateOrder, updateStatus, deleteOrder } = useOrders();
  const { expenses, loading: expensesLoading, createExpense, updateExpense, deleteExpense } = useExpenses();

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const handleOpenAddOrder = useCallback(() => {
    setEditingOrder(null);
    setOrderModalOpen(true);
  }, []);

  const handleEditOrder = useCallback((order) => {
    setEditingOrder(order);
    setOrderModalOpen(true);
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

  const renderCurrentView = () => {
    if (ordersLoading && currentView !== 'expenses') {
      return (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Loader2 className="animate-spin" size={24} color="var(--primary)" />
          <span>Đang tải dữ liệu...</span>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} refreshTrigger={refreshTrigger} />;
      case 'orders':
        return (
          <Orders
            orders={orders}
            searchQuery={searchQuery}
            onEditOrder={handleEditOrder}
            onUpdateStatus={handleUpdateStatus}
            onDeleteOrder={handleDeleteOrder}
          />
        );
      case 'timeline':
        return <Timeline orders={orders} />;
      case 'expenses':
        return (
          <Expenses
            expenses={expenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        pendingCount={pendingCount}
      />

      <div className="main-wrapper">
        <Header
          currentView={currentView}
          onSearch={setSearchQuery}
          onAddOrder={handleOpenAddOrder}
          onAddExpense={handleOpenAddExpense}
        />

        <main className="page-container">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav currentView={currentView} onNavigate={setCurrentView} />

      {/* Mobile FAB */}
      <button className="mobile-fab" id="mobileFabOrder" onClick={handleOpenAddOrder} title="Tạo đơn hàng mới">
        <Plus size={18} />
        <span>Tạo đơn</span>
      </button>

      {/* Modals */}
      <OrderModal
        isOpen={orderModalOpen}
        order={editingOrder}
        onClose={() => setOrderModalOpen(false)}
        onSave={handleSaveOrder}
      />
      <ExpenseModal
        isOpen={expenseModalOpen}
        expense={editingExpense}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

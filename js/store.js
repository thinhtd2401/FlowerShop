/**
 * store.js - Central Data Store & Business Logic Layer for FlowerStore App
 */

const STORAGE_KEYS = {
  ORDERS: 'flowerstore_orders_v1',
  EXPENSES: 'flowerstore_expenses_v1',
  SETTINGS: 'flowerstore_settings_v1'
};

class FlowerStore {
  constructor() {
    this.orders = [];
    this.expenses = [];
    this.settings = {
      storeName: 'Floral Studio & Gifts',
      storePhone: '0968 606 185',
      storeAddress: '123 Phố Hoa, Quận Đống Đa, Hà Nội',
      bankName: 'MB Bank',
      bankAccount: '0968606185',
      bankOwner: 'TIEM HOA FLORAL'
    };
    this.listeners = [];
    this.init();
  }

  init() {
    try {
      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (storedOrders) {
        this.orders = JSON.parse(storedOrders);
      } else if (window.INITIAL_ORDERS) {
        this.orders = JSON.parse(JSON.stringify(window.INITIAL_ORDERS));
        this.saveOrders();
      }

      if (storedExpenses) {
        this.expenses = JSON.parse(storedExpenses);
      } else if (window.INITIAL_EXPENSES) {
        this.expenses = JSON.parse(JSON.stringify(window.INITIAL_EXPENSES));
        this.saveExpenses();
      }

      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (e) {
      console.error('Error initializing store data:', e);
      if (window.INITIAL_ORDERS) this.orders = JSON.parse(JSON.stringify(window.INITIAL_ORDERS));
      if (window.INITIAL_EXPENSES) this.expenses = JSON.parse(JSON.stringify(window.INITIAL_EXPENSES));
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(); } catch (err) { console.error('Listener callback error:', err); }
    });
  }

  saveOrders() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    this.notify();
  }

  saveExpenses() {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(this.expenses));
    this.notify();
  }

  saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    this.notify();
  }

  // --- Orders Management ---
  getOrders() {
    return [...this.orders];
  }

  getOrderById(id) {
    return this.orders.find(o => o.id === id);
  }

  addOrder(orderData) {
    // Generate new ID
    const maxNum = this.orders.reduce((max, o) => {
      const match = o.id.match(/DH-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = `DH-${String(maxNum + 1).padStart(3, '0')}`;

    const quantity = parseInt(orderData.quantity, 10) || 1;
    const unitPrice = parseInt(orderData.unitPrice, 10) || 0;
    const totalAmount = quantity * unitPrice;
    const depositAmount = parseInt(orderData.depositAmount, 10) || 0;
    const remainingAmount = Math.max(0, totalAmount - depositAmount);

    const newOrder = {
      id: newId,
      orderDate: orderData.orderDate || new Date().toLocaleDateString('vi-VN'),
      customerName: (orderData.customerName || 'Khách vãng lai').trim(),
      channel: orderData.channel || 'Instagram',
      phone: (orderData.phone || '').trim(),
      productName: (orderData.productName || 'Bó hoa tươi').trim(),
      quantity,
      unitPrice,
      totalAmount,
      depositAmount,
      remainingAmount,
      deliveryDate: orderData.deliveryDate || new Date().toLocaleDateString('vi-VN'),
      deliveryTime: (orderData.deliveryTime || '').trim(),
      deliveryType: orderData.deliveryType || 'Khách qua lấy',
      status: orderData.status || 'pending',
      notes: (orderData.notes || '').trim()
    };

    this.orders.unshift(newOrder);
    this.saveOrders();
    return newOrder;
  }

  updateOrder(id, updatedFields) {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) return null;

    const current = this.orders[idx];
    const qty = updatedFields.quantity !== undefined ? parseInt(updatedFields.quantity, 10) : current.quantity;
    const unitP = updatedFields.unitPrice !== undefined ? parseInt(updatedFields.unitPrice, 10) : current.unitPrice;
    const total = qty * unitP;
    const dep = updatedFields.depositAmount !== undefined ? parseInt(updatedFields.depositAmount, 10) : current.depositAmount;
    const rem = updatedFields.remainingAmount !== undefined ? parseInt(updatedFields.remainingAmount, 10) : Math.max(0, total - dep);

    this.orders[idx] = {
      ...current,
      ...updatedFields,
      quantity: qty,
      unitPrice: unitP,
      totalAmount: total,
      depositAmount: dep,
      remainingAmount: rem
    };

    this.saveOrders();
    return this.orders[idx];
  }

  updateOrderStatus(id, newStatus) {
    const order = this.getOrderById(id);
    if (!order) return null;

    order.status = newStatus;
    if (newStatus === 'completed') {
      // Once completed, mark remaining balance as 0 (fully collected)
      order.remainingAmount = 0;
    }
    this.saveOrders();
    return order;
  }

  deleteOrder(id) {
    const initialLen = this.orders.length;
    this.orders = this.orders.filter(o => o.id !== id);
    if (this.orders.length !== initialLen) {
      this.saveOrders();
      return true;
    }
    return false;
  }

  // --- Expenses Management ---
  getExpenses() {
    return [...this.expenses];
  }

  addExpense(expData) {
    const maxNum = this.expenses.reduce((max, e) => {
      const match = e.id.match(/EXP-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = `EXP-${String(maxNum + 1).padStart(3, '0')}`;

    const quantity = parseInt(expData.quantity, 10) || 1;
    const unitPrice = parseInt(expData.unitPrice, 10) || 0;
    const totalCost = quantity * unitPrice;

    const newExp = {
      id: newId,
      date: expData.date || new Date().toLocaleDateString('vi-VN'),
      category: expData.category || 'Hoa tươi',
      itemName: (expData.itemName || 'Chi phí nhập hàng').trim(),
      quantity,
      unitPrice,
      totalCost
    };

    this.expenses.unshift(newExp);
    this.saveExpenses();
    return newExp;
  }

  deleteExpense(id) {
    const initialLen = this.expenses.length;
    this.expenses = this.expenses.filter(e => e.id !== id);
    if (this.expenses.length !== initialLen) {
      this.saveExpenses();
      return true;
    }
    return false;
  }

  // --- Metrics & Calculations ---
  getMetrics() {
    const activeOrders = this.orders.filter(o => o.status !== 'cancelled');

    // Total Capital (Tổng vốn)
    const totalCapital = this.expenses.reduce((sum, e) => sum + (e.totalCost || 0), 0);

    // Potential Revenue (Tổng giá trị toàn bộ đơn)
    const totalPotentialRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Delivered Revenue (Doanh thu các đơn đã giao thành công)
    const deliveredRevenue = this.orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Total Actual Cash Collected (Tiền đã thu: toàn bộ đơn hoàn thành + cọc của đơn chờ)
    const actualCollectedCash = this.orders.reduce((sum, o) => {
      if (o.status === 'completed') return sum + o.totalAmount;
      if (o.status === 'pending' || o.status === 'ready') return sum + (o.depositAmount || 0);
      return sum;
    }, 0);

    // Remaining Debt To Collect (Công nợ còn phải thu khi giao)
    const pendingCollection = this.orders
      .filter(o => o.status === 'pending' || o.status === 'ready')
      .reduce((sum, o) => sum + (o.remainingAmount || 0), 0);

    // Profit = Actual Collected Cash - Total Capital
    const profit = actualCollectedCash - totalCapital;
    // Expected Profit if all pending orders complete
    const expectedProfit = totalPotentialRevenue - totalCapital;

    // Counts by status
    const statusCounts = {
      all: this.orders.length,
      pending: this.orders.filter(o => o.status === 'pending').length,
      ready: this.orders.filter(o => o.status === 'ready').length,
      completed: this.orders.filter(o => o.status === 'completed').length,
      cancelled: this.orders.filter(o => o.status === 'cancelled').length
    };

    // Orders scheduled for peak 20/10
    const peakOct20Orders = activeOrders.filter(o => (o.deliveryDate || '').includes('20/10'));
    const peakOct20Count = peakOct20Orders.length;
    const peakOct20Value = peakOct20Orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Top products
    const productMap = {};
    activeOrders.forEach(o => {
      const p = o.productName || 'Bó hoa tươi';
      productMap[p] = (productMap[p] || 0) + (o.quantity || 1);
    });
    const topProducts = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Channels breakdown
    const channelMap = {};
    activeOrders.forEach(o => {
      const c = o.channel || 'Khác';
      channelMap[c] = (channelMap[c] || 0) + 1;
    });

    return {
      totalCapital,
      totalPotentialRevenue,
      deliveredRevenue,
      actualCollectedCash,
      pendingCollection,
      profit,
      expectedProfit,
      statusCounts,
      peakOct20Count,
      peakOct20Value,
      topProducts,
      channelMap
    };
  }

  // --- Reset to Original Seed Data ---
  resetToSeed() {
    if (window.INITIAL_ORDERS) {
      this.orders = JSON.parse(JSON.stringify(window.INITIAL_ORDERS));
      this.saveOrders();
    }
    if (window.INITIAL_EXPENSES) {
      this.expenses = JSON.parse(JSON.stringify(window.INITIAL_EXPENSES));
      this.saveExpenses();
    }
  }

  // --- Export to Excel ---
  exportToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện xuất Excel chưa sẵn sàng. Vui lòng thử lại sau vài giây!');
      return;
    }

    // Sheet 1: Orders
    const ordersData = this.orders.map((o, idx) => ({
      'STT': idx + 1,
      'Mã Đơn': o.id,
      'Ngày Nhận': o.orderDate,
      'Tên Khách': o.customerName,
      'Kênh Liên Hệ': o.channel,
      'Số Điện Thoại': o.phone,
      'Sản Phẩm': o.productName,
      'Số Lượng': o.quantity,
      'Đơn Giá (VNĐ)': o.unitPrice,
      'Thành Tiền (VNĐ)': o.totalAmount,
      'Đã Cọc (VNĐ)': o.depositAmount,
      'Còn Lại (VNĐ)': o.remainingAmount,
      'Ngày Giao': o.deliveryDate,
      'Giờ Hẹn': o.deliveryTime,
      'Hình Thức': o.deliveryType,
      'Trạng Thái': o.status === 'completed' ? 'Đã giao' : o.status === 'ready' ? 'Đã bó xong' : o.status === 'cancelled' ? 'Đã hủy' : 'Chờ cắm/giao',
      'Ghi Chú': o.notes
    }));

    // Sheet 2: Expenses
    const expensesData = this.expenses.map((e, idx) => ({
      'STT': idx + 1,
      'Mã Chi Phí': e.id,
      'Ngày Chi': e.date,
      'Danh Mục': e.category,
      'Tên Mặt Hàng': e.itemName,
      'Số Lượng': e.quantity,
      'Đơn Giá (VNĐ)': e.unitPrice,
      'Tổng Chi (VNĐ)': e.totalCost
    }));

    const wb = XLSX.utils.book_new();
    const wsOrders = XLSX.utils.json_to_sheet(ordersData);
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData);

    XLSX.utils.book_append_sheet(wb, wsOrders, 'Đơn Hàng (Orders)');
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Chi Phí Vốn (Expenses)');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `FlowerStore_Data_${dateStr}.xlsx`);
  }
}

// Global store instance
window.store = new FlowerStore();

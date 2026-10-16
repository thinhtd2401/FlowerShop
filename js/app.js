/**
 * app.js - Main UI Controller for FlowerStore Management App
 */

// Lucide Icon Helper for dynamic SVG string rendering
function getLucideIcon(name, options = {}) {
  const size = options.size || 16;
  const className = options.className || '';
  const strokeWidth = options.strokeWidth || 2;
  const style = options.style || '';

  // Convert kebab-case (e.g. flower-2, check-circle-2) to PascalCase (Flower2, CheckCircle2)
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  if (typeof window !== 'undefined' && window.lucide && window.lucide.icons && window.lucide.icons[pascalName] && typeof document !== 'undefined') {
    const iconDef = window.lucide.icons[pascalName];
    const attrs = {
      width: size,
      height: size,
      class: `lucide lucide-${name} ${className}`.trim(),
      'stroke-width': strokeWidth
    };
    if (style) attrs.style = style;
    const svgElem = window.lucide.createElement(iconDef, attrs);
    return svgElem.outerHTML;
  }
  return `<i data-lucide="${name}" class="${className}" style="${style}"></i>`;
}

// Format currency in Vietnamese Dong (VNĐ)
function formatMoney(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' 
    ? getLucideIcon('check-circle-2', { size: 16, style: 'vertical-align: -2px; margin-right: 6px;' }) 
    : type === 'error' 
      ? getLucideIcon('alert-circle', { size: 16, style: 'vertical-align: -2px; margin-right: 6px;' }) 
      : getLucideIcon('info', { size: 16, style: 'vertical-align: -2px; margin-right: 6px;' });
  toast.innerHTML = `<span style="display:inline-flex; align-items:center;">${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

class FlowerApp {
  constructor() {
    this.currentView = 'dashboard';
    this.orderFilterStatus = 'all';
    this.orderFilterDate = 'all';
    this.searchQuery = '';
    this.currentEditingOrderId = null;

    this.initElements();
    this.bindEvents();
    this.render();

    // Subscribe to store updates
    window.store.subscribe(() => {
      this.render();
    });
  }

  initElements() {
    // Navigation
    this.navItems = document.querySelectorAll('.nav-item');
    this.mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    this.views = document.querySelectorAll('.view-section');
    this.pageTitle = document.getElementById('pageTitle');
    this.pageSubtitle = document.getElementById('pageSubtitle');

    // Modals
    this.orderModal = document.getElementById('orderModal');
    this.orderModalTitle = document.getElementById('orderModalTitle');
    this.orderForm = document.getElementById('orderForm');

    this.expenseModal = document.getElementById('expenseModal');
    this.expenseForm = document.getElementById('expenseForm');

    this.receiptModal = document.getElementById('receiptModal');
    this.receiptContent = document.getElementById('receiptContent');

    // Order search & filter
    this.searchInput = document.getElementById('globalSearch');
    this.filterTabs = document.querySelectorAll('.filter-tab');
    this.datePills = document.querySelectorAll('.date-pill');
  }

  bindEvents() {
    // Navigation items
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.switchView(view);
      });
    });

    this.mobileNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.switchView(view);
      });
    });

    // Search
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        if (this.currentView !== 'orders') {
          this.switchView('orders');
        } else {
          this.renderOrdersTable();
        }
      });
    }

    // Filter tabs
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.orderFilterStatus = tab.dataset.status;
        this.renderOrdersTable();
      });
    });

    // Date pills
    this.datePills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.datePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.orderFilterDate = pill.dataset.date;
        this.renderOrdersTable();
      });
    });

    // Auto-calculate order price & balance in modal
    const modalQty = document.getElementById('orderQty');
    const modalUnit = document.getElementById('orderUnitPrice');
    const modalDeposit = document.getElementById('orderDeposit');
    const modalTotal = document.getElementById('orderTotal');
    const modalRemain = document.getElementById('orderRemain');

    const updateCalc = () => {
      const q = parseInt(modalQty.value, 10) || 1;
      const u = parseInt(modalUnit.value, 10) || 0;
      const tot = q * u;
      const dep = parseInt(modalDeposit.value, 10) || 0;
      const rem = Math.max(0, tot - dep);
      modalTotal.value = formatMoney(tot);
      modalRemain.value = formatMoney(rem);
    };

    if (modalQty && modalUnit && modalDeposit) {
      modalQty.addEventListener('input', updateCalc);
      modalUnit.addEventListener('input', updateCalc);
      modalDeposit.addEventListener('input', updateCalc);
    }

    // Preset Flower buttons in modal
    document.querySelectorAll('.preset-flower').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodInput = document.getElementById('orderProduct');
        const priceInput = document.getElementById('orderUnitPrice');
        if (prodInput) prodInput.value = btn.dataset.name;
        if (priceInput && btn.dataset.price) {
          priceInput.value = btn.dataset.price;
          updateCalc();
        }
      });
    });

    // Preset Time buttons in modal
    document.querySelectorAll('.preset-time').forEach(btn => {
      btn.addEventListener('click', () => {
        const timeInput = document.getElementById('orderTime');
        if (timeInput) timeInput.value = btn.dataset.time;
      });
    });

    // Save Order Form
    if (this.orderForm) {
      this.orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveOrder();
      });
    }

    // Save Expense Form
    if (this.expenseForm) {
      this.expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveExpense();
      });
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    window.scrollTo(0, 0);

    // Update Nav
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });
    this.mobileNavItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update Views
    this.views.forEach(view => {
      view.classList.toggle('active', view.id === `${viewName}View`);
    });

    // Update Titles
    const titleMap = {
      dashboard: { title: 'Tổng Quan Kinh Doanh', sub: 'Theo dõi doanh thu, chi phí vốn và tiến độ đơn hàng thời gian thực' },
      orders: { title: 'Quản Lý Đơn Hàng', sub: 'Danh sách và kiểm soát cọc - công nợ - trạng thái đơn hoa' },
      timeline: { title: 'Bảng Tiến Độ Cắm Hoa', sub: 'Lịch hẹn giao & nhận hoa sắp xếp theo từng khung giờ trong ngày' },
      expenses: { title: 'Quản Lý Vốn & Chi Phí', sub: 'Chi tiết các đợt nhập hoa tươi, phụ liệu bao bì và vận hành tiệm' }
    };

    if (titleMap[viewName]) {
      this.pageTitle.innerText = titleMap[viewName].title;
      this.pageSubtitle.innerText = titleMap[viewName].sub;
    }

    this.render();
  }

  render() {
    this.renderSidebarBadges();
    if (this.currentView === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentView === 'orders') {
      this.renderOrdersTable();
    } else if (this.currentView === 'timeline') {
      this.renderTimeline();
    } else if (this.currentView === 'expenses') {
      this.renderExpensesTable();
    }
    if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  renderSidebarBadges() {
    const metrics = window.store.getMetrics();
    const pendingBadge = document.getElementById('pendingOrderBadge');
    if (pendingBadge) {
      pendingBadge.innerText = metrics.statusCounts.pending;
      pendingBadge.style.display = metrics.statusCounts.pending > 0 ? 'inline-block' : 'none';
    }
  }

  // --- Render Dashboard ---
  renderDashboard() {
    const metrics = window.store.getMetrics();

    // KPI Cards
    const elRev = document.getElementById('kpiRevenue');
    const elCap = document.getElementById('kpiCapital');
    const elProfit = document.getElementById('kpiProfit');
    const elDebt = document.getElementById('kpiDebt');

    if (elRev) elRev.innerText = formatMoney(metrics.totalPotentialRevenue);
    if (elCap) elCap.innerText = formatMoney(metrics.totalCapital);
    if (elProfit) {
      elProfit.innerText = formatMoney(metrics.profit);
      elProfit.style.color = metrics.profit >= 0 ? 'var(--primary)' : '#e11d48';
    }
    if (elDebt) elDebt.innerText = formatMoney(metrics.pendingCollection);

    // Peak Season Banner 20/10
    const elPeakCount = document.getElementById('peak2010Count');
    const elPeakVal = document.getElementById('peak2010Value');
    if (elPeakCount) elPeakCount.innerText = `${metrics.peakOct20Count} Đơn Hàng`;
    if (elPeakVal) elPeakVal.innerText = formatMoney(metrics.peakOct20Value);

    // Status distribution
    const totalOrders = metrics.statusCounts.all || 1;
    const pctCompleted = Math.round((metrics.statusCounts.completed / totalOrders) * 100);
    const pctPending = Math.round((metrics.statusCounts.pending / totalOrders) * 100);
    const pctReady = Math.round((metrics.statusCounts.ready / totalOrders) * 100);

    const elPctCompleted = document.getElementById('pctCompleted');
    const elBarCompleted = document.getElementById('barCompleted');
    if (elPctCompleted) elPctCompleted.innerText = `${pctCompleted}% (${metrics.statusCounts.completed} đơn)`;
    if (elBarCompleted) elBarCompleted.style.width = `${pctCompleted}%`;

    const elPctPending = document.getElementById('pctPending');
    const elBarPending = document.getElementById('barPending');
    if (elPctPending) elPctPending.innerText = `${pctPending}% (${metrics.statusCounts.pending} đơn)`;
    if (elBarPending) elBarPending.style.width = `${pctPending}%`;

    // Top Products list
    const topProdContainer = document.getElementById('topProductsList');
    if (topProdContainer) {
      topProdContainer.innerHTML = metrics.topProducts.map((p, idx) => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border-light);">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:700; color:var(--primary); font-size:12px; width:20px;">#${idx + 1}</span>
            <span style="font-weight:600; font-size:13.5px;">${p.name}</span>
          </div>
          <span style="font-weight:700; font-size:13px; background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:12px;">${p.qty} bó</span>
        </div>
      `).join('');
    }

    // Channels breakdown
    const channelContainer = document.getElementById('channelDistribution');
    if (channelContainer) {
      const totalChan = Object.values(metrics.channelMap).reduce((a, b) => a + b, 0) || 1;
      channelContainer.innerHTML = Object.entries(metrics.channelMap).map(([chan, count]) => {
        const pct = Math.round((count / totalChan) * 100);
        return `
          <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:600; margin-bottom:4px;">
              <span>${chan}</span>
              <span>${count} đơn (${pct}%)</span>
            </div>
            <div style="height:6px; background:var(--bg-muted); border-radius:3px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:var(--primary);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Recent orders snippet (last 5)
    const recentTable = document.getElementById('dashboardRecentOrders');
    if (recentTable) {
      const recent = window.store.getOrders().slice(0, 5);
      recentTable.innerHTML = recent.map(o => `
        <tr>
          <td><span class="order-code">${o.id}</span></td>
          <td><strong>${o.customerName}</strong></td>
          <td>${o.productName}</td>
          <td><strong>${formatMoney(o.totalAmount)}</strong></td>
          <td>${this.renderStatusBadge(o.status)}</td>
          <td>${o.deliveryDate} ${o.deliveryTime ? `(${o.deliveryTime})` : ''}</td>
        </tr>
      `).join('');
    }

    // Recent orders snippet for mobile cards
    const recentCards = document.getElementById('dashboardRecentMobileCards');
    if (recentCards) {
      const recent = window.store.getOrders().slice(0, 5);
      recentCards.innerHTML = recent.map(o => `
        <div class="order-card-mobile">
          <div class="order-card-mobile-header">
            <span class="order-card-mobile-code">${getLucideIcon('flower-2', { size: 13, style: 'vertical-align: -2px; margin-right: 2px;' })} ${o.id}</span>
            ${this.renderStatusBadge(o.status)}
          </div>
          <div class="order-card-mobile-body">
            <div class="order-card-mobile-cust">
              <span class="name">${o.customerName}</span>
              <span style="font-size:12px; color:var(--text-muted);">${o.deliveryDate}</span>
            </div>
            <div class="order-card-mobile-prod">
              <div class="prod-name">${o.productName}</div>
              <div class="prod-meta">SL: ${o.quantity} • ${formatMoney(o.totalAmount)}</div>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // --- Render Orders Table ---
  renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let orders = window.store.getOrders();

    // 1. Status Filter
    if (this.orderFilterStatus !== 'all') {
      orders = orders.filter(o => o.status === this.orderFilterStatus);
    }

    // 2. Date Filter
    if (this.orderFilterDate === 'oct20') {
      orders = orders.filter(o => (o.deliveryDate || '').includes('20/10'));
    } else if (this.orderFilterDate === 'oct16') {
      orders = orders.filter(o => (o.deliveryDate || '').includes('16/10'));
    } else if (this.orderFilterDate === 'has_remain') {
      orders = orders.filter(o => o.remainingAmount > 0 && o.status !== 'completed' && o.status !== 'cancelled');
    }

    // 3. Search Query
    if (this.searchQuery) {
      orders = orders.filter(o =>
        o.id.toLowerCase().includes(this.searchQuery) ||
        o.customerName.toLowerCase().includes(this.searchQuery) ||
        o.phone.includes(this.searchQuery) ||
        o.productName.toLowerCase().includes(this.searchQuery) ||
        (o.deliveryDate || '').includes(this.searchQuery)
      );
    }

    // Update Counts on Filter Tabs
    const allOrders = window.store.getOrders();
    const countAll = document.getElementById('tabCountAll');
    const countPending = document.getElementById('tabCountPending');
    const countReady = document.getElementById('tabCountReady');
    const countCompleted = document.getElementById('tabCountCompleted');

    if (countAll) countAll.innerText = allOrders.length;
    if (countPending) countPending.innerText = allOrders.filter(o => o.status === 'pending').length;
    if (countReady) countReady.innerText = allOrders.filter(o => o.status === 'ready').length;
    if (countCompleted) countCompleted.innerText = allOrders.filter(o => o.status === 'completed').length;

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 40px 20px; color:var(--text-muted);">
            <div style="margin-bottom:8px; color:var(--text-muted);">${getLucideIcon('flower-2', { size: 36, strokeWidth: 1.5 })}</div>
            <p style="font-weight:600; font-size:15px;">Không tìm thấy đơn hàng nào phù hợp</p>
            <p style="font-size:13px;">Hãy thử thay đổi bộ lọc hoặc tạo một đơn mới!</p>
          </td>
        </tr>
      `;
      const mobileCards = document.getElementById('ordersMobileCards');
      if (mobileCards) {
        mobileCards.innerHTML = `
          <div style="text-align:center; padding: 40px 20px; color:var(--text-muted); background:#fff; border-radius:12px; border:1px solid var(--border-color);">
            <div style="margin-bottom:8px; color:var(--text-muted);">${getLucideIcon('flower-2', { size: 36, strokeWidth: 1.5 })}</div>
            <p style="font-weight:600; font-size:15px;">Không tìm thấy đơn hàng nào</p>
            <p style="font-size:13px;">Hãy thử thay đổi bộ lọc hoặc tạo một đơn mới!</p>
          </div>
        `;
      }
      return;
    }

    // Render Desktop Table Rows
    tbody.innerHTML = orders.map(o => {
      const channelClass = o.channel === 'Instagram' ? 'ig' : o.channel === 'Zalo' ? 'zl' : 'phone';
      const isDeliverShip = o.deliveryType.toLowerCase().includes('ship');

      return `
        <tr>
          <td>
            <span class="order-code">${o.id}</span>
            <div style="font-size:11px; color:var(--text-muted);">${o.orderDate}</div>
          </td>
          <td>
            <span class="customer-name">${o.customerName}</span>
            <div class="customer-meta">
              <span class="badge-channel ${channelClass}">${o.channel}</span>
              ${o.phone ? `<span>${getLucideIcon('phone', { size: 12, style: 'vertical-align: -1px; margin-right: 3px; color: var(--text-muted);' })} ${o.phone}</span>` : ''}
            </div>
          </td>
          <td class="product-cell">
            <span class="product-name" title="${o.productName}">${o.productName}</span>
            <div style="font-size:11.5px; color:var(--text-muted);">
              SL: <strong>${o.quantity}</strong> × ${formatMoney(o.unitPrice)}
            </div>
            ${o.notes ? `<span class="product-note">"${o.notes}"</span>` : ''}
          </td>
          <td>
            <div class="price-main">${formatMoney(o.totalAmount)}</div>
            ${o.depositAmount > 0 ? `<div class="deposit-pill">Đã cọc: ${formatMoney(o.depositAmount)}</div>` : ''}
          </td>
          <td>
            ${o.status === 'completed'
              ? `<span class="remain-zero">Đã thu đủ ${getLucideIcon('check-circle-2', { size: 12, style: 'vertical-align: -1px; margin-left: 2px;' })}</span>`
              : o.remainingAmount > 0
                ? `<div class="remain-alert">Còn thu: ${formatMoney(o.remainingAmount)}</div>`
                : `<span class="remain-zero">Đã cọc 100%</span>`
            }
          </td>
          <td>
            <div style="font-weight:700; color:var(--text-main);">${o.deliveryDate}</div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
              ${o.deliveryTime ? `<span class="time-slot-tag" style="font-size:11px;">${getLucideIcon('clock', { size: 11, style: 'vertical-align: -1px; margin-right: 2px;' })} ${o.deliveryTime}</span>` : ''}
              <span class="delivery-badge ${isDeliverShip ? 'ship' : 'pickup'}" style="font-size:11px;">
                ${isDeliverShip ? `${getLucideIcon('truck', { size: 12, style: 'vertical-align: -1px; margin-right: 3px;' })} Ship` : `${getLucideIcon('store', { size: 12, style: 'vertical-align: -1px; margin-right: 3px;' })} Tự lấy`}
              </span>
            </div>
          </td>
          <td>
            ${this.renderStatusDropdown(o)}
          </td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary btn-sm" onclick="app.openReceiptModal('${o.id}')" title="In phiếu gửi hoa / Bill">
                ${getLucideIcon('receipt', { size: 13, style: 'vertical-align: -1px; margin-right: 3px;' })} Bill
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" onclick="app.openEditOrderModal('${o.id}')" title="Chỉnh sửa">
                ${getLucideIcon('pencil', { size: 14 })}
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" onclick="app.handleDeleteOrder('${o.id}')" title="Xóa" style="color:#ef4444;">
                ${getLucideIcon('trash-2', { size: 14 })}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Render Mobile Cards
    const mobileCardsContainer = document.getElementById('ordersMobileCards');
    if (mobileCardsContainer) {
      mobileCardsContainer.innerHTML = orders.map(o => {
        const channelClass = o.channel === 'Instagram' ? 'ig' : o.channel === 'Zalo' ? 'zl' : 'phone';
        const isDeliverShip = o.deliveryType.toLowerCase().includes('ship');

        return `
          <div class="order-card-mobile">
            <div class="order-card-mobile-header">
              <div>
                <span class="order-card-mobile-code">${getLucideIcon('flower-2', { size: 13, style: 'vertical-align: -2px; margin-right: 2px;' })} ${o.id}</span>
                <span style="font-size:11px; color:var(--text-muted); margin-left:4px;">${o.orderDate}</span>
              </div>
              <div>
                ${this.renderStatusDropdown(o)}
              </div>
            </div>

            <div class="order-card-mobile-body">
              <div class="order-card-mobile-cust">
                <span class="name">${o.customerName}</span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="badge-channel ${channelClass}">${o.channel}</span>
                  ${o.phone ? `<a href="tel:${o.phone}" style="font-size:12px; font-weight:700; color:var(--primary); text-decoration:none; display:inline-flex; align-items:center; gap:3px;">${getLucideIcon('phone', { size: 12 })} Gọi</a>` : ''}
                </div>
              </div>

              <div class="order-card-mobile-prod">
                <div class="prod-name">${o.productName}</div>
                <div class="prod-meta">SL: <strong>${o.quantity}</strong> × ${formatMoney(o.unitPrice)}</div>
                ${o.notes ? `<div style="font-size:11.5px; color:#b45309; margin-top:4px;">Lưu ý: "${o.notes}"</div>` : ''}
              </div>

              <div class="order-card-mobile-finance">
                <div>
                  <span style="color:var(--text-muted); font-size:11.5px;">Tổng tiền:</span>
                  <strong style="color:var(--text-main); font-size:13.5px; margin-left:4px;">${formatMoney(o.totalAmount)}</strong>
                  ${o.depositAmount > 0 ? `<div style="font-size:11px; color:#059669; font-weight:600;">Đã cọc: ${formatMoney(o.depositAmount)}</div>` : ''}
                </div>
                <div style="text-align:right;">
                  ${o.status === 'completed'
                    ? `<span style="color:#059669; font-weight:700; font-size:12px; display:inline-flex; align-items:center; gap:2px;">Đã thu đủ ${getLucideIcon('check-circle-2', { size: 12 })}</span>`
                    : o.remainingAmount > 0
                      ? `<div style="color:#e11d48; font-weight:800; font-size:12.5px;">Còn thu: ${formatMoney(o.remainingAmount)}</div>`
                      : `<span style="color:#059669; font-weight:600; font-size:12px;">Đã trả 100%</span>`
                  }
                </div>
              </div>

              <div class="order-card-mobile-logistics">
                <div>
                  <span>${getLucideIcon('calendar', { size: 12, style: 'vertical-align: -1px; margin-right: 3px; color: var(--text-muted);' })} <strong>${o.deliveryDate}</strong></span>
                  ${o.deliveryTime ? `<span class="time-slot-tag" style="margin-left:6px; font-size:10.5px;">${getLucideIcon('clock', { size: 11, style: 'vertical-align: -1px; margin-right: 2px;' })} ${o.deliveryTime}</span>` : ''}
                </div>
                <span class="delivery-badge ${isDeliverShip ? 'ship' : 'pickup'}">
                  ${isDeliverShip ? `${getLucideIcon('truck', { size: 12, style: 'vertical-align: -1px; margin-right: 3px;' })} Giao tận nơi` : `${getLucideIcon('store', { size: 12, style: 'vertical-align: -1px; margin-right: 3px;' })} Khách lấy`}
                </span>
              </div>
            </div>

            <div class="order-card-mobile-actions">
              <button class="btn btn-secondary btn-sm" onclick="app.openReceiptModal('${o.id}')" style="flex:1; justify-content:center;">
                ${getLucideIcon('receipt', { size: 13, style: 'vertical-align: -1px; margin-right: 3px;' })} In Bill / VietQR
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" onclick="app.openEditOrderModal('${o.id}')" title="Sửa">
                ${getLucideIcon('pencil', { size: 14 })}
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" onclick="app.handleDeleteOrder('${o.id}')" title="Xóa" style="color:#ef4444;">
                ${getLucideIcon('trash-2', { size: 14 })}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderStatusBadge(status) {
    const map = {
      pending: { label: 'Chờ cắm hoa', class: 'pending', iconName: 'clock' },
      ready: { label: 'Đã bó xong', class: 'ready', iconName: 'sparkles' },
      completed: { label: 'Đã giao thành công', class: 'completed', iconName: 'check-circle-2' },
      cancelled: { label: 'Đã hủy', class: 'cancelled', iconName: 'x-circle' }
    };
    const s = map[status] || map.pending;
    return `<span class="status-badge ${s.class}">${getLucideIcon(s.iconName, { size: 12, style: 'vertical-align: -1px; margin-right: 4px;' })} ${s.label}</span>`;
  }

  renderStatusDropdown(order) {
    return `
      <select onchange="app.handleStatusChange('${order.id}', this.value)" style="padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600; border:1px solid var(--border-color); background:#fff; cursor:pointer;">
        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Chờ cắm hoa</option>
        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Đã bó xong</option>
        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Đã giao (Thu đủ)</option>
        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Đã hủy đơn</option>
      </select>
    `;
  }

  handleStatusChange(orderId, newStatus) {
    window.store.updateOrderStatus(orderId, newStatus);
    showToast(`Đã cập nhật trạng thái đơn ${orderId}!`, 'success');
  }

  // --- Render Timeline View ---
  renderTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    const orders = window.store.getOrders().filter(o => o.status !== 'cancelled');

    // Group orders by deliveryDate
    const groups = {};
    orders.forEach(o => {
      const d = o.deliveryDate || 'Chưa định ngày';
      if (!groups[d]) groups[d] = [];
      groups[d].push(o);
    });

    // Custom sort dates: prioritize 16/10, 17/10, 18/10, 19/10, 20/10
    const sortedDates = Object.keys(groups).sort((a, b) => {
      // Simple parse dd/mm/yyyy
      const parseDate = (str) => {
        const parts = str.split('/');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
        return new Date(0);
      };
      return parseDate(a) - parseDate(b);
    });

    if (sortedDates.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding:40px; color:var(--text-muted);">Không có đơn hàng nào cần tiến độ.</p>`;
      return;
    }

    container.innerHTML = sortedDates.map(dateStr => {
      const list = groups[dateStr];
      const isOct20 = dateStr.includes('20/10');
      const totalAmountDate = list.reduce((s, o) => s + o.totalAmount, 0);

      return `
        <div class="timeline-date-group">
          <div class="timeline-date-header">
            <h3>
              <span>${getLucideIcon('calendar', { size: 16, style: 'vertical-align: -2px; margin-right: 4px;' })} ${dateStr}</span>
              ${isOct20 ? `<span class="badge" style="background:#e11d48; color:white; font-size:12px; padding:3px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">ĐỈNH ĐIỂM 20/10 ${getLucideIcon('flame', { size: 13 })}</span>` : ''}
            </h3>
            <span style="font-size:13px; color:var(--text-muted); font-weight:600;">
              ${list.length} đơn • Tổng: <strong>${formatMoney(totalAmountDate)}</strong>
            </span>
          </div>
          <div class="timeline-cards-grid">
            ${list.map(o => {
              const isShip = o.deliveryType.toLowerCase().includes('ship');
              return `
                <div class="timeline-card" style="${o.status === 'completed' ? 'opacity:0.65; background:#fbfbfb;' : ''}">
                  <div class="timeline-card-header">
                    <div>
                      <span class="order-code">${o.id}</span>
                      <span class="delivery-badge ${isShip ? 'ship' : 'pickup'}" style="margin-left:6px;">
                        ${isShip ? `${getLucideIcon('truck', { size: 12, style: 'vertical-align:-1px; margin-right:3px;' })} Ship` : `${getLucideIcon('store', { size: 12, style: 'vertical-align:-1px; margin-right:3px;' })} Khách lấy`}
                      </span>
                    </div>
                    <div class="time-slot-tag">
                      ${getLucideIcon('clock', { size: 12, style: 'vertical-align: -1px; margin-right: 3px;' })} ${o.deliveryTime || 'Không hẹn giờ'}
                    </div>
                  </div>
                  <div class="timeline-card-body">
                    <h4>${o.productName}</h4>
                    <div class="cust-info">
                      Khách: <strong>${o.customerName}</strong>
                      ${o.phone ? ` • SĐT: ${o.phone}` : ''}
                    </div>
                    ${o.notes ? `<div style="font-size:11.5px; color:#b45309; background:#fffbeb; padding:4px 8px; border-radius:4px; margin-top:6px;">Lưu ý: ${o.notes}</div>` : ''}
                  </div>
                  <div class="timeline-card-footer">
                    <div>
                      ${o.status === 'completed'
                        ? `<span style="color:#059669; font-weight:700; display:inline-flex; align-items:center; gap:3px;">Đã giao thành công ${getLucideIcon('check-circle-2', { size: 13 })}</span>`
                        : o.remainingAmount > 0
                          ? `<span style="color:#e11d48; font-weight:700;">Còn thu: ${formatMoney(o.remainingAmount)}</span>`
                          : `<span style="color:#059669; font-weight:600;">Đã trả đủ</span>`
                      }
                    </div>
                    <div>
                      ${o.status === 'pending'
                        ? `<button class="btn btn-primary btn-sm" onclick="app.handleStatusChange('${o.id}', 'ready')">${getLucideIcon('check', { size: 13, style: 'vertical-align:-1px; margin-right:3px;' })} Xong Bó Hoa</button>`
                        : o.status === 'ready'
                          ? `<button class="btn btn-sm" style="background:#059669; color:#fff;" onclick="app.handleStatusChange('${o.id}', 'completed')">${getLucideIcon('check-circle-2', { size: 13, style: 'vertical-align:-1px; margin-right:3px;' })} Đã Giao</button>`
                          : `<span style="font-size:12px; color:var(--text-muted);">Hoàn tất</span>`
                      }
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Render Expenses Table ---
  renderExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;

    const expenses = window.store.getExpenses();
    const totalCap = window.store.getMetrics().totalCapital;

    const elTotal = document.getElementById('expenseTotalValue');
    if (elTotal) elTotal.innerText = formatMoney(totalCap);

    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">Chưa có khoản chi nào.</td></tr>`;
      const mobileExpenses = document.getElementById('expensesMobileCards');
      if (mobileExpenses) {
        mobileExpenses.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); background:#fff; border-radius:12px;">Chưa có khoản chi nào.</div>`;
      }
      return;
    }

    tbody.innerHTML = expenses.map(e => `
      <tr>
        <td><strong style="color:var(--primary);">${e.id}</strong></td>
        <td>${e.date}</td>
        <td>
          <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; background:${e.category === 'Hoa tươi' ? '#ecfdf5' : e.category === 'Phụ liệu & Bao bì' ? '#eff6ff' : '#fef3c7'}; color:${e.category === 'Hoa tươi' ? '#047857' : e.category === 'Phụ liệu & Bao bì' ? '#1d4ed8' : '#b45309'};">
            ${e.category}
          </span>
        </td>
        <td><strong>${e.itemName}</strong></td>
        <td>${e.quantity}</td>
        <td>${formatMoney(e.unitPrice)}</td>
        <td><strong style="color:var(--text-main);">${formatMoney(e.totalCost)}</strong></td>
        <td>
          <button class="btn btn-secondary btn-sm btn-icon" onclick="app.handleDeleteExpense('${e.id}')" style="color:#ef4444;" title="Xóa">
            ${getLucideIcon('trash-2', { size: 14 })}
          </button>
        </td>
      </tr>
    `).join('');

    // Mobile Expenses Cards
    const mobileExpenses = document.getElementById('expensesMobileCards');
    if (mobileExpenses) {
      mobileExpenses.innerHTML = expenses.map(e => `
        <div class="expense-card-mobile">
          <div>
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <strong style="color:var(--primary); font-size:13px;">${e.id}</strong>
              <span style="font-size:10.5px; font-weight:700; padding:1px 6px; border-radius:4px; background:${e.category === 'Hoa tươi' ? '#ecfdf5' : e.category === 'Phụ liệu & Bao bì' ? '#eff6ff' : '#fef3c7'}; color:${e.category === 'Hoa tươi' ? '#047857' : e.category === 'Phụ liệu & Bao bì' ? '#1d4ed8' : '#b45309'};">
                ${e.category}
              </span>
              <span style="font-size:11.5px; color:var(--text-muted);">${e.date}</span>
            </div>
            <div style="font-weight:700; font-size:14px; color:var(--text-main);">${e.itemName}</div>
            <div style="font-size:12px; color:var(--text-muted);">SL: ${e.quantity} × ${formatMoney(e.unitPrice)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:15px; font-weight:800; color:#d97706; margin-bottom:6px;">${formatMoney(e.totalCost)}</div>
            <button class="btn btn-secondary btn-sm btn-icon" onclick="app.handleDeleteExpense('${e.id}')" style="color:#ef4444;" title="Xóa">
              ${getLucideIcon('trash-2', { size: 14 })}
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // --- Modals Management ---
  openAddOrderModal() {
    this.currentEditingOrderId = null;
    this.orderModalTitle.innerHTML = `${getLucideIcon('flower-2', { size: 18, style: 'vertical-align:-3px; color:var(--primary); margin-right:4px;' })} Tạo Đơn Hàng Hoa Mới`;
    this.orderForm.reset();

    // Default dates
    document.getElementById('orderDate').value = new Date().toLocaleDateString('vi-VN');
    document.getElementById('orderDeliveryDate').value = '20/10/2026';
    document.getElementById('orderQty').value = 1;
    document.getElementById('orderUnitPrice').value = 250000;
    document.getElementById('orderDeposit').value = 100000;
    document.getElementById('orderTotal').value = formatMoney(250000);
    document.getElementById('orderRemain').value = formatMoney(150000);

    this.orderModal.classList.add('active');
  }

  openEditOrderModal(orderId) {
    const order = window.store.getOrderById(orderId);
    if (!order) return;

    this.currentEditingOrderId = orderId;
    this.orderModalTitle.innerHTML = `${getLucideIcon('pencil', { size: 18, style: 'vertical-align:-3px; color:var(--primary); margin-right:4px;' })} Chỉnh Sửa Đơn Hàng ${order.id}`;

    document.getElementById('orderCustomerName').value = order.customerName;
    document.getElementById('orderPhone').value = order.phone;
    document.getElementById('orderChannel').value = order.channel;
    document.getElementById('orderProduct').value = order.productName;
    document.getElementById('orderQty').value = order.quantity;
    document.getElementById('orderUnitPrice').value = order.unitPrice;
    document.getElementById('orderDeposit').value = order.depositAmount;
    document.getElementById('orderDate').value = order.orderDate;
    document.getElementById('orderDeliveryDate').value = order.deliveryDate;
    document.getElementById('orderTime').value = order.deliveryTime;
    document.getElementById('orderDeliveryType').value = order.deliveryType;
    document.getElementById('orderStatusSelect').value = order.status;
    document.getElementById('orderNotes').value = order.notes || '';

    document.getElementById('orderTotal').value = formatMoney(order.totalAmount);
    document.getElementById('orderRemain').value = formatMoney(order.remainingAmount);

    this.orderModal.classList.add('active');
  }

  closeOrderModal() {
    this.orderModal.classList.remove('active');
  }

  handleSaveOrder() {
    const custName = document.getElementById('orderCustomerName').value;
    const phone = document.getElementById('orderPhone').value;
    const channel = document.getElementById('orderChannel').value;
    const product = document.getElementById('orderProduct').value;
    const qty = parseInt(document.getElementById('orderQty').value, 10) || 1;
    const unitPrice = parseInt(document.getElementById('orderUnitPrice').value, 10) || 0;
    const deposit = parseInt(document.getElementById('orderDeposit').value, 10) || 0;
    const orderDate = document.getElementById('orderDate').value;
    const deliveryDate = document.getElementById('orderDeliveryDate').value;
    const deliveryTime = document.getElementById('orderTime').value;
    const deliveryType = document.getElementById('orderDeliveryType').value;
    const status = document.getElementById('orderStatusSelect').value;
    const notes = document.getElementById('orderNotes').value;

    const data = {
      customerName: custName,
      phone,
      channel,
      productName: product,
      quantity: qty,
      unitPrice,
      depositAmount: deposit,
      orderDate,
      deliveryDate,
      deliveryTime,
      deliveryType,
      status,
      notes
    };

    if (this.currentEditingOrderId) {
      window.store.updateOrder(this.currentEditingOrderId, data);
      showToast(`Đã cập nhật đơn ${this.currentEditingOrderId}!`, 'success');
    } else {
      const created = window.store.addOrder(data);
      showToast(`Đã tạo đơn ${created.id} thành công!`, 'success');
    }

    this.closeOrderModal();
  }

  handleDeleteOrder(orderId) {
    if (confirm(`Bạn có chắc chắn muốn xóa đơn ${orderId} này không?`)) {
      window.store.deleteOrder(orderId);
      showToast(`Đã xóa đơn ${orderId}`, 'info');
    }
  }

  // --- Expense Modal ---
  openAddExpenseModal() {
    this.expenseForm.reset();
    document.getElementById('expenseDate').value = new Date().toLocaleDateString('vi-VN');
    document.getElementById('expenseQty').value = 1;
    this.expenseModal.classList.add('active');
  }

  closeExpenseModal() {
    this.expenseModal.classList.remove('active');
  }

  handleSaveExpense() {
    const category = document.getElementById('expenseCategory').value;
    const itemName = document.getElementById('expenseItemName').value;
    const qty = parseInt(document.getElementById('expenseQty').value, 10) || 1;
    const unitPrice = parseInt(document.getElementById('expenseUnitPrice').value, 10) || 0;
    const date = document.getElementById('expenseDate').value;

    window.store.addExpense({
      category,
      itemName,
      quantity: qty,
      unitPrice,
      date
    });

    showToast('Đã thêm khoản chi phí thành công!', 'success');
    this.closeExpenseModal();
  }

  handleDeleteExpense(expId) {
    if (confirm(`Bạn có chắc muốn xóa khoản chi ${expId}?`)) {
      window.store.deleteExpense(expId);
      showToast(`Đã xóa chi phí ${expId}`, 'info');
    }
  }

  // --- Receipt / Bill Modal ---
  openReceiptModal(orderId) {
    const order = window.store.getOrderById(orderId);
    if (!order) return;

    const s = window.store.settings;
    const isPaidInFull = order.status === 'completed' || order.remainingAmount === 0;

    // VietQR quick link (MB Bank / Vietcombank format)
    const qrUrl = order.remainingAmount > 0
      ? `https://img.vietqr.io/image/${encodeURIComponent(s.bankName)}-${encodeURIComponent(s.bankAccount)}-compact2.png?amount=${order.remainingAmount}&addInfo=${encodeURIComponent(order.id)}&accountName=${encodeURIComponent(s.bankOwner)}`
      : null;

    this.receiptContent.innerHTML = `
      <div class="receipt-wrapper">
        <div class="receipt-header">
          <h2>${s.storeName}</h2>
          <p>${getLucideIcon('phone', { size: 12, style: 'vertical-align: -1px; margin-right: 3px; color: var(--text-muted);' })} ${s.storePhone} • ${getLucideIcon('map-pin', { size: 12, style: 'vertical-align: -1px; margin-right: 3px; color: var(--text-muted);' })} ${s.storeAddress}</p>
          <div style="margin-top:8px; font-weight:700; font-size:16px; color:var(--text-main);">
            PHIẾU GIAO HOA & HÓA ĐƠN
          </div>
        </div>

        <div class="receipt-order-info">
          <div>
            <div><strong>Mã Đơn:</strong> ${order.id}</div>
            <div><strong>Ngày đặt:</strong> ${order.orderDate}</div>
            <div><strong>Khách hàng:</strong> ${order.customerName}</div>
            ${order.phone ? `<div><strong>SĐT:</strong> ${order.phone}</div>` : ''}
          </div>
          <div style="text-align:right;">
            <div><strong>Ngày nhận:</strong> ${order.deliveryDate}</div>
            <div><strong>Giờ hẹn:</strong> ${order.deliveryTime || 'Trong ngày'}</div>
            <div><strong>Hình thức:</strong> ${order.deliveryType}</div>
          </div>
        </div>

        ${order.notes ? `
          <div style="background:#fffbeb; border:1px solid #fde68a; padding:8px 12px; border-radius:6px; font-size:12px; margin-bottom:14px;">
            <strong>Ghi chú / Yêu cầu bó hoa:</strong> ${order.notes}
          </div>
        ` : ''}

        <table class="receipt-table">
          <thead>
            <tr>
              <th>Sản phẩm / Mẫu hoa</th>
              <th style="text-align:center;">SL</th>
              <th style="text-align:right;">Đơn giá</th>
              <th style="text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${order.productName}</strong></td>
              <td style="text-align:center;">${order.quantity}</td>
              <td style="text-align:right;">${formatMoney(order.unitPrice)}</td>
              <td style="text-align:right;"><strong>${formatMoney(order.totalAmount)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="receipt-totals">
          <div class="receipt-total-row">
            <span>Tổng tiền:</span>
            <span>${formatMoney(order.totalAmount)}</span>
          </div>
          <div class="receipt-total-row">
            <span>Tiền đã cọc trước:</span>
            <span style="color:#059669; font-weight:600;">-${formatMoney(order.depositAmount)}</span>
          </div>
          <div class="receipt-total-row highlight">
            <span>CÒN LẠI PHẢI THU:</span>
            <span>${formatMoney(order.remainingAmount)}</span>
          </div>
        </div>

        ${!isPaidInFull && qrUrl ? `
          <div class="receipt-qr-section">
            <p style="font-weight:700; color:var(--primary); margin-bottom:6px;">QUÉT MÃ QR ĐỂ THANH TOÁN (VIETQR)</p>
            <img src="${qrUrl}" alt="VietQR" style="max-width:180px; height:auto; border-radius:8px; border:1px solid #e5e7eb;" />
            <p>Ngân hàng: <strong>${s.bankName}</strong> • STK: <strong>${s.bankAccount}</strong></p>
            <p>Chủ TK: <strong>${s.bankOwner}</strong> • Nội dung: <strong>${order.id}</strong></p>
          </div>
        ` : `
          <div style="text-align:center; padding:12px; background:#ecfdf5; border-radius:6px; color:#047857; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px;">
            ${getLucideIcon('check-circle-2', { size: 16 })} ĐƠN HÀNG ĐÃ THANH TOÁN ĐỦ 100%
          </div>
        `}

        <div style="text-align:center; margin-top:20px; font-size:12px; color:var(--text-muted); font-style:italic;">
          Cảm ơn quý khách đã tin tưởng và ủng hộ ${s.storeName}! ${getLucideIcon('flower-2', { size: 13, style: 'vertical-align: -2px; margin-left: 3px; color: var(--primary);' })}
        </div>
      </div>
    `;

    this.receiptModal.classList.add('active');
    if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  closeReceiptModal() {
    this.receiptModal.classList.remove('active');
  }

  printReceipt() {
    window.print();
  }

  // --- Data Export & Reset ---
  exportExcel() {
    window.store.exportToExcel();
  }

  resetOriginalData() {
    if (confirm('Khôi phục toàn bộ dữ liệu gốc từ file FlowOrder.xlsx (60 đơn và 13 chi phí)? Mọi thay đổi bạn vừa tạo sẽ được đặt lại.')) {
      window.store.resetToSeed();
      showToast('Đã khôi phục dữ liệu gốc từ file Excel!', 'success');
    }
  }
}

// Instantiate App safely
function initApp() {
  if (!window.app) {
    window.app = new FlowerApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

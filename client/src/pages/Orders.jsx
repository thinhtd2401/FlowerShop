/**
 * pages/Orders.jsx - Quản lý đơn hàng
 */
import { useState, useMemo } from 'react';
import {
  Pencil,
  Trash2,
  Clock,
  FileText,
  Check,
  Flame,
  Phone,
  Truck,
  Store,
  MapPin,
  MessageSquare,
  Calendar,
  ShoppingBag,
  DollarSign,
  Flower2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  X,
  Package,
  UserCheck
} from 'lucide-react';
import { formatMoney, getStatusInfo, parseDateToComparable, formatToDDMMYYYY, formatOrderTime } from '../utils/format';
import DatePicker from '../components/UI/DatePicker';
import ConfirmDeleteModal from '../components/UI/ConfirmDeleteModal';
import ConfirmDeliveryModal from '../components/UI/ConfirmDeliveryModal';

const STATUS_LABELS = {
  all: 'Tất cả',
  pending: 'Chờ cắm',
  ready: 'Đã bó xong',
  completed: 'Đã giao',
  cancelled: 'Đã hủy'
};

function getTodayDMY() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function Orders({ orders, searchQuery, onEditOrder, onUpdateStatus, onDeleteOrder, onOpenGallery }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const todayStr = useMemo(() => getTodayDMY(), []);
  const todayShort = todayStr.slice(0, 5);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status filter: Nếu chọn 'all', mặc định chỉ xem các đơn có hiệu lực (trừ khi đang gõ tìm kiếm cụ thể)
      if (filterStatus === 'all') {
        if (!searchQuery && o.status === 'cancelled') return false;
      } else if (o.status !== filterStatus) {
        return false;
      }

      // Custom Date Range filter
      if (startDate || endDate) {
        const orderDateIso = parseDateToComparable(o.deliveryDate) || parseDateToComparable(o.orderDate);
        const startIso = parseDateToComparable(startDate);
        const endIso = parseDateToComparable(endDate);
        if (orderDateIso) {
          if (startIso && orderDateIso < startIso) return false;
          if (endIso && orderDateIso > endIso) return false;
        } else {
          return false;
        }
      } else {
        // Preset Quick Date filters
        if (filterDate === 'today' && !(o.deliveryDate || '').includes(todayShort)) return false;
        if (filterDate === 'oct20' && !(o.deliveryDate || '').includes('20/10')) return false;
        if (filterDate === 'has_remain' && (o.remainingAmount || 0) <= 0) return false;
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.phone || '').includes(q) ||
          (o.productName || '').toLowerCase().includes(q) ||
          (o.id || '').toLowerCase().includes(q) ||
          (o.channel || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, filterStatus, filterDate, startDate, endDate, searchQuery, todayShort]);

  // Tab counts based on active orders (all chỉ đếm các đơn có hiệu lực)
  const counts = useMemo(() => ({
    all: orders.filter(o => o.status !== 'cancelled').length,
    pending: orders.filter(o => o.status === 'pending').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  // Summary stats based on filteredOrders (khi chọn tab 'cancelled', tóm tắt chính xác các đơn hủy; ở các tab khác, loại trừ đơn hủy khỏi doanh thu)
  const summary = useMemo(() => {
    let totalAmount = 0;
    let totalDeposit = 0;
    let totalRemaining = 0;
    let totalQty = 0;

    const targetOrders = filterStatus === 'cancelled'
      ? filteredOrders
      : filteredOrders.filter(o => o.status !== 'cancelled');

    targetOrders.forEach(o => {
      totalAmount += parseInt(o.totalAmount, 10) || 0;
      totalDeposit += parseInt(o.depositAmount, 10) || 0;
      if (o.status !== 'cancelled') {
        totalRemaining += parseInt(o.remainingAmount, 10) || 0;
      }
      totalQty += parseInt(o.quantity, 10) || 1;
    });

    return {
      count: targetOrders.length,
      totalQty,
      totalAmount,
      totalDeposit,
      totalRemaining,
    };
  }, [filteredOrders, filterStatus]);

  const isFiltering = filterStatus !== 'all' || filterDate !== 'all' || Boolean(startDate) || Boolean(endDate) || Boolean(searchQuery);

  const handleResetAllFilters = () => {
    setFilterStatus('all');
    setFilterDate('all');
    setStartDate('');
    setEndDate('');
  };

  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDeliveryOrder, setPendingDeliveryOrder] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === 'completed') {
      setPendingDeliveryOrder(order);
      return;
    }
    if (onUpdateStatus) {
      await onUpdateStatus(order.id, newStatus);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!pendingDeliveryOrder || !onUpdateStatus) return;
    try {
      setIsUpdatingStatus(true);
      await onUpdateStatus(pendingDeliveryOrder.id, 'completed');
      setPendingDeliveryOrder(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    } catch (err) {
      console.error('Lỗi khi xóa đơn hàng:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="view-section active" id="ordersView">
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {['all', 'pending', 'ready', 'completed', 'cancelled'].map(status => (
            <button key={status}
              className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
              data-status={status}
              onClick={() => setFilterStatus(status)}>
              <span>{STATUS_LABELS[status]}</span>
              <span className="tab-count">{counts[status] ?? filteredOrders.length}</span>
            </button>
          ))}
        </div>

        <div className="filter-date-controls">
          <div className="quick-date-pills">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }}>Lọc nhanh:</span>
            <button
              className={`date-pill ${filterDate === 'all' && !startDate && !endDate ? 'active' : ''}`}
              onClick={() => {
                setFilterDate('all');
                setStartDate('');
                setEndDate('');
              }}>
              Tất cả ngày
            </button>
            <button
              className={`date-pill ${filterDate === 'today' ? 'active' : ''}`}
              onClick={() => {
                setFilterDate('today');
                setStartDate('');
                setEndDate('');
              }}>
              Hôm nay ({todayShort})
            </button>
            <button
              className={`date-pill ${filterDate === 'oct20' ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                setFilterDate('oct20');
                setStartDate('');
                setEndDate('');
              }}>
              <span>Đợt 20/10</span>
              <Flame size={12} color="#f59e0b" />
            </button>
            <button
              className={`date-pill ${filterDate === 'has_remain' ? 'active' : ''}`}
              onClick={() => {
                setFilterDate('has_remain');
                setStartDate('');
                setEndDate('');
              }}>
              Chưa trả hết cọc
            </button>
          </div>

          {/* Date Range Picker */}
          <div className="date-range-picker" title="Lọc đơn theo khoảng ngày giao hoa">
            <DatePicker
              label="Từ:"
              value={startDate}
              onChange={(dmy) => {
                setStartDate(dmy);
                setFilterDate('custom');
              }}
              clearable={false}
              placeholder="dd/mm/yyyy"
            />
            <span className="date-range-sep">—</span>
            <DatePicker
              label="Đến:"
              icon={false}
              value={endDate}
              onChange={(dmy) => {
                setEndDate(dmy);
                setFilterDate('custom');
              }}
              clearable={false}
              placeholder="dd/mm/yyyy"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                className="btn-clear-date"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setFilterDate('all');
                }}
                title="Xóa lọc khoảng ngày"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Summary Bar */}
      <div className="orders-summary-bar">
        <div className="summary-stats-grid">
          {/* Tổng đơn hàng / Tổng đơn hủy */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon orders">
              <ShoppingBag size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">
                {filterStatus === 'cancelled' ? 'Tổng Đơn Hủy' : 'Tổng Đơn Hàng'}
              </span>
              <span className="summary-stat-value">{summary.count} đơn</span>
            </div>
          </div>

          {/* Tổng số lượng bó hoa */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon qty">
              <Flower2 size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">
                {filterStatus === 'cancelled' ? 'Số Bó Đã Hủy' : 'Tổng Số Lượng'}
              </span>
              <span className="summary-stat-value">{summary.totalQty} bó hoa</span>
            </div>
          </div>

          {/* Tổng tiền / Doanh thu / Giá trị hủy */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon revenue">
              <DollarSign size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">
                {filterStatus === 'cancelled' ? 'Tổng Tiền Đơn Hủy' : 'Tổng Doanh Thu'}
              </span>
              <span className="summary-stat-value" style={{ color: filterStatus === 'cancelled' ? '#ef4444' : 'var(--primary)' }}>
                {formatMoney(summary.totalAmount)}
              </span>
            </div>
          </div>

          {/* Đã thu (Cọc) */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon deposit">
              <CheckCircle2 size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">Đã Thu (Cọc)</span>
              <span className="summary-stat-value" style={{ color: '#16a34a' }}>
                {formatMoney(summary.totalDeposit)}
              </span>
            </div>
          </div>

          {/* Công nợ còn lại */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon debt">
              <AlertCircle size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">Còn Lại (Cần Thu)</span>
              <span className="summary-stat-value" style={{ color: summary.totalRemaining > 0 ? '#e11d48' : '#16a34a' }}>
                {formatMoney(summary.totalRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Status Indicator & Reset */}
        {isFiltering && (
          <div className="summary-filter-banner">
            <div className="summary-filter-info">
              <Check size={14} color="var(--primary)" />
              <span>
                Đang hiển thị kết quả theo bộ lọc: <strong>{filteredOrders.length} đơn</strong>
                {startDate && endDate ? ` (từ ${formatToDDMMYYYY(startDate)} đến ${formatToDDMMYYYY(endDate)})` : ''}
                {startDate && !endDate ? ` (từ ngày ${formatToDDMMYYYY(startDate)})` : ''}
                {!startDate && endDate ? ` (đến ngày ${formatToDDMMYYYY(endDate)})` : ''}
                {filterStatus !== 'all' ? ` · Trạng thái: ${STATUS_LABELS[filterStatus]}` : ''}
                {searchQuery ? ` · Từ khóa: "${searchQuery}"` : ''}
              </span>
            </div>
            <button type="button" className="btn-reset-filters" onClick={handleResetAllFilters}>
              <RotateCcw size={12} />
              <span>Đặt lại tất cả lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="table-responsive desktop-only-table">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 44, textAlign: 'center' }}>STT</th>
              <th>Mã / Ngày</th>
              <th>Khách Hàng / Kênh</th>
              <th>Sản Phẩm &amp; Lưu Ý</th>
              <th style={{ textAlign: 'center' }}>Số Lượng</th>
              <th>Tổng Tiền</th>
              <th>Công Nợ (Còn Lại)</th>
              <th>Ngày &amp; Giờ Nhận</th>
              <th>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Không tìm thấy đơn hàng nào
                </td>
              </tr>
            ) : filteredOrders.map((o, index) => {
              const { className: statusClass } = getStatusInfo(o.status);
              const qty = parseInt(o.quantity, 10) || 1;
              return (
                <tr key={o.id}>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>
                    {index + 1}
                  </td>
                  <td>
                    <strong style={{ fontSize: 13 }}>{o.id}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{o.orderDate}</div>
                    {formatOrderTime(o.createdAt) && (
                      <div
                        style={{
                          fontSize: 10.5,
                          color: 'var(--text-muted)',
                          marginTop: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontVariantNumeric: 'tabular-nums'
                        }}
                        title={`Thời gian tạo đơn: ${formatOrderTime(o.createdAt)}`}
                      >
                        <Clock size={10} color="var(--primary)" />
                        <span>{formatOrderTime(o.createdAt)}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{o.customerName}</strong>
                    {o.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.phone}</div>}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                      <span style={{ fontSize: 11, background: 'var(--bg-muted)', padding: '1px 6px', borderRadius: 10 }}>{o.channel}</span>
                      {o.assignedUserName && (
                        <span style={{ fontSize: 11, background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }} title="Người tiếp nhận & xử lý đơn">
                          <UserCheck size={10} />
                          <span>{o.assignedUserName}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {o.images && o.images.length > 0 && (
                        <div
                          className="orders-table-thumb"
                          onClick={() => onOpenGallery && onOpenGallery({ order: o, initialIndex: 0 })}
                          title={`Xem ${o.images.length} ảnh mẫu hoa`}
                        >
                          <img src={o.images[0]} alt={o.productName} />
                          {o.images.length > 1 && (
                            <span className="orders-table-thumb-badge">+{o.images.length - 1}</span>
                          )}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <strong>{o.productName}</strong>
                        {o.unitPrice > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            Đơn giá: {formatMoney(o.unitPrice)}
                          </div>
                        )}
                        {o.notes && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FileText size={11} />
                            <span>{o.notes}</span>
                          </div>
                        )}
                        {o.cardMessage && (
                          <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, fontStyle: 'italic' }}>
                            <MessageSquare size={11} />
                            <span>Thiệp: {o.cardMessage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="order-qty-tag">
                      {qty} bó
                    </span>
                  </td>
                  <td><strong>{formatMoney(o.totalAmount)}</strong></td>
                  <td>
                    {o.remainingAmount > 0 ? (
                      <span style={{ color: '#e11d48', fontWeight: 700 }}>{formatMoney(o.remainingAmount)}</span>
                    ) : (
                      <span style={{ color: 'var(--status-completed-text)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Check size={13} />
                        <span>Đủ</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>{o.deliveryDate}</strong>
                    {o.deliveryTime && (
                      <div style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span>{o.deliveryTime}</span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {o.deliveryType === 'Giao hàng / Book ship' ? <Truck size={11} /> : <Store size={11} />}
                      <span>{o.deliveryType}</span>
                    </div>
                    {o.deliveryAddress && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }} title={o.deliveryAddress}>
                        <MapPin size={11} color="var(--primary)" />
                        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.deliveryAddress}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      className={`status-badge ${statusClass}`}
                      value={o.status}
                      onChange={e => handleStatusChange(o, e.target.value)}
                      style={{ border: 'none', cursor: 'pointer', appearance: 'auto', minWidth: 120 }}>
                      <option value="pending">Chờ cắm hoa</option>
                      <option value="ready">Đã bó xong</option>
                      <option value="completed">Đã giao</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEditOrder(o)} title="Chỉnh sửa">
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDeleteClick(o)}
                        style={{ color: '#e11d48' }} title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only-cards" id="ordersMobileCards">
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 12 }}>
            Không tìm thấy đơn hàng nào
          </div>
        ) : filteredOrders.map((o, index) => {
          const { className: statusClass } = getStatusInfo(o.status);
          const qty = parseInt(o.quantity, 10) || 1;
          return (
            <div key={o.id} className="mobile-order-card">
              {/* Header: ID, Date, Channel, Status dropdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="order-stt-badge">#{index + 1}</span>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>{o.id}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <span>{o.orderDate}</span>
                      {formatOrderTime(o.createdAt) && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
                            <Clock size={10} color="var(--primary)" />
                            <span>{formatOrderTime(o.createdAt)}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <select
                  className={`status-badge ${statusClass}`}
                  value={o.status}
                  onChange={e => handleStatusChange(o, e.target.value)}
                  style={{ border: 'none', cursor: 'pointer', fontSize: 11.5, padding: '3px 8px' }}>
                  <option value="pending">Chờ cắm hoa</option>
                  <option value="ready">Đã bó xong</option>
                  <option value="completed">Đã giao</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              {/* Customer info & Channel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>{o.customerName}</div>
                  {o.phone && (
                    <a href={`tel:${o.phone}`} style={{ fontSize: 12.5, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Phone size={12} />
                      <span>{o.phone}</span>
                    </a>
                  )}
                  {o.assignedUserName && (
                    <div style={{ fontSize: 11, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                      <UserCheck size={11} />
                      <span>Xử lý: <strong>{o.assignedUserName}</strong></span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {o.channel}
                </span>
              </div>

              {/* Product, Quantity & notes */}
              <div style={{ background: 'var(--bg-app)', padding: '8px 10px', borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {o.images && o.images.length > 0 && (
                    <div
                      className="orders-mobile-thumb"
                      onClick={() => onOpenGallery && onOpenGallery({ order: o, initialIndex: 0 })}
                      title={`Xem ${o.images.length} ảnh mẫu hoa`}
                    >
                      <img src={o.images[0]} alt={o.productName} />
                      {o.images.length > 1 && (
                        <span className="orders-table-thumb-badge">+{o.images.length - 1}</span>
                      )}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {o.productName}
                      </div>
                      <span className="mobile-qty-badge">
                        <Package size={11} />
                        <span>SL: {qty}</span>
                      </span>
                    </div>
                    {o.unitPrice > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Đơn giá: {formatMoney(o.unitPrice)}
                      </div>
                    )}
                  </div>
                </div>
                {o.notes && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <FileText size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{o.notes}</span>
                  </div>
                )}
                {o.cardMessage && (
                  <div style={{ fontSize: 11.5, color: 'var(--primary)', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4, fontStyle: 'italic' }}>
                    <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Thiệp: {o.cardMessage}</span>
                  </div>
                )}
                {o.deliveryAddress && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <MapPin size={12} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Giao tới: {o.deliveryAddress}</span>
                  </div>
                )}
              </div>

              {/* Delivery & Logistics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {o.deliveryType === 'Giao hàng / Book ship' ? <Truck size={13} /> : <Store size={13} />}
                  <span>{o.deliveryType}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-main)', fontWeight: 600 }}>
                  <Clock size={12} color="var(--primary)" />
                  <span>{o.deliveryTime ? `${o.deliveryTime} · ` : ''}{o.deliveryDate}</span>
                </div>
              </div>

              {/* Finance & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tổng thanh toán</div>
                  <strong style={{ fontSize: 15, color: 'var(--primary)' }}>{formatMoney(o.totalAmount)}</strong>
                  {o.remainingAmount > 0 && (
                    <span style={{ fontSize: 11.5, color: '#e11d48', marginLeft: 8, fontWeight: 700 }}>
                      (Còn: {formatMoney(o.remainingAmount)})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEditOrder(o)} title="Chỉnh sửa">
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDeleteClick(o)} style={{ color: '#e11d48' }} title="Xóa">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Xác Nhận Xóa Đơn Hàng */}
      <ConfirmDeleteModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa Đơn Hàng"
        itemName={orderToDelete ? `${orderToDelete.id} — ${orderToDelete.customerName} (${formatMoney(orderToDelete.totalAmount)})` : ''}
        message="Hành động này sẽ xóa vĩnh viễn đơn hàng này khỏi hệ thống và không thể hoàn tác."
        confirmText="Xóa Đơn Hàng"
        isDeleting={isDeleting}
      />

      {/* Modal Xác Nhận Đã Nhận Đủ Tiền Khi Chọn Đã Giao */}
      <ConfirmDeliveryModal
        isOpen={!!pendingDeliveryOrder}
        onClose={() => setPendingDeliveryOrder(null)}
        onConfirm={handleConfirmDelivery}
        order={pendingDeliveryOrder}
        isUpdating={isUpdatingStatus}
      />
    </section>
  );
}

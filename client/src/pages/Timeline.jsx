/**
 * pages/Timeline.jsx - Tiến độ cắm hoa theo ngày và khung giờ
 * Hỗ trợ tổng hợp số bó, chờ cắm, đã cắm, đã giao, đã hủy từng ngày,
 * kèm bộ lọc trạng thái và tìm kiếm nhanh tiếng Việt.
 */
import { useState, useMemo } from 'react';
import {
  Flame, Calendar, Clock, Flower2, FileText, Truck, Store,
  Camera, Images, Maximize2, MessageSquare, Phone, Package,
  Search, X, Sparkles, CheckCircle2, AlertCircle, RotateCcw, UserCheck
} from 'lucide-react';
import DatePicker from '../components/UI/DatePicker';
import ConfirmDeliveryModal from '../components/UI/ConfirmDeliveryModal';
import { formatMoney, getStatusInfo, removeVietnameseTones, parseDateToComparable } from '../utils/format';

function getTodayDMY() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function getTomorrowDMY() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function sortByTime(orders) {
  return [...orders].sort((a, b) => {
    if (!a.deliveryTime) return 1;
    if (!b.deliveryTime) return -1;
    return a.deliveryTime.localeCompare(b.deliveryTime);
  });
}

export default function Timeline({ orders, onUpdateStatus, onOpenGallery }) {
  const todayStr = useMemo(() => getTodayDMY(), []);
  const tomorrowStr = useMemo(() => getTomorrowDMY(), []);

  // Filter modes: 'default' (Hôm nay + Ngày mai) | 'today' | 'tomorrow' | 'oct20' | 'all' | 'custom'
  const [filterMode, setFilterMode] = useState('default');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Status Filter: 'all' | 'pending' | 'ready' | 'completed' | 'cancelled'
  const [statusFilter, setStatusFilter] = useState('all');

  // Search query: Mã đơn, tên khách, SĐT, mẫu hoa
  const [searchQuery, setSearchQuery] = useState('');

  const isPeakDay = (date) => date?.includes('20/10');

  // 1. Tính toán số liệu cho các tab Ngày (Date Filter Pills)
  const dateCounts = useMemo(() => {
    let todayOrders = 0;
    let todayBouquets = 0;
    let tomorrowOrders = 0;
    let tomorrowBouquets = 0;
    let defaultOrders = 0;
    let defaultBouquets = 0;
    let oct20Orders = 0;
    let oct20Bouquets = 0;
    let allBouquets = 0;

    orders.forEach(o => {
      const d = o.deliveryDate?.trim();
      const qty = parseInt(o.quantity, 10) || 1;
      if (o.status !== 'cancelled') {
        allBouquets += qty;
      }

      if (d === todayStr) {
        todayOrders++;
        if (o.status !== 'cancelled') todayBouquets += qty;
      }
      if (d === tomorrowStr) {
        tomorrowOrders++;
        if (o.status !== 'cancelled') tomorrowBouquets += qty;
      }
      if (d === todayStr || d === tomorrowStr) {
        defaultOrders++;
        if (o.status !== 'cancelled') defaultBouquets += qty;
      }
      if (d?.includes('20/10')) {
        oct20Orders++;
        if (o.status !== 'cancelled') oct20Bouquets += qty;
      }
    });

    return {
      default: defaultOrders,
      defaultBouquets,
      today: todayOrders,
      todayBouquets,
      tomorrow: tomorrowOrders,
      tomorrowBouquets,
      oct20: oct20Orders,
      oct20Bouquets,
      all: orders.length,
      allBouquets
    };
  }, [orders, todayStr, tomorrowStr]);

  // 2. Lọc đơn hàng theo Ngày đã chọn (chưa lọc theo Status và Search)
  const dateFilteredOrders = useMemo(() => {
    return orders.filter(o => {
      const d = o.deliveryDate?.trim();
      if (filterMode === 'default') {
        return d === todayStr || d === tomorrowStr;
      }
      if (filterMode === 'today') {
        return d === todayStr;
      }
      if (filterMode === 'tomorrow') {
        return d === tomorrowStr;
      }
      if (filterMode === 'oct20') {
        return d?.includes('20/10');
      }
      if (filterMode === 'custom') {
        if (!startDate && !endDate) return true;
        const orderDateIso = parseDateToComparable(d);
        if (!orderDateIso) return false;
        const startIso = parseDateToComparable(startDate);
        const endIso = parseDateToComparable(endDate);
        if (startIso && orderDateIso < startIso) return false;
        if (endIso && orderDateIso > endIso) return false;
        return true;
      }
      if (filterMode === 'all') {
        return true;
      }
      return true;
    });
  }, [orders, filterMode, startDate, endDate, todayStr, tomorrowStr]);

  // 3. Tính toán Macro Summary và Status Counts cho khoảng ngày đang xem
  const macroSummary = useMemo(() => {
    let totalOrders = 0;
    let totalBouquets = 0;
    let pendingCount = 0;
    let readyCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    dateFilteredOrders.forEach(o => {
      totalOrders++;
      const qty = parseInt(o.quantity, 10) || 1;
      if (o.status !== 'cancelled') {
        totalBouquets += qty;
      }
      if (o.status === 'pending') pendingCount++;
      else if (o.status === 'ready') readyCount++;
      else if (o.status === 'completed') completedCount++;
      else if (o.status === 'cancelled') cancelledCount++;
    });

    return {
      totalOrders,
      totalBouquets,
      pendingCount,
      readyCount,
      completedCount,
      cancelledCount
    };
  }, [dateFilteredOrders]);

  // 4. Nhóm đơn theo từng ngày kèm tính toán Daily KPI chi tiết & lọc theo Status + Search
  const grouped = useMemo(() => {
    const dateMap = {};

    // Gom toàn bộ đơn theo ngày trong phạm vi dateFilteredOrders
    dateFilteredOrders.forEach(o => {
      const d = o.deliveryDate?.trim() || 'Chưa xác định';
      if (!dateMap[d]) {
        dateMap[d] = {
          date: d,
          allDateOrders: [],
          visibleOrders: []
        };
      }
      dateMap[d].allDateOrders.push(o);
    });

    const normalizedSearch = removeVietnameseTones(searchQuery);
    const rawSearch = searchQuery.trim().toLowerCase();

    Object.values(dateMap).forEach(group => {
      // Lọc các đơn hiển thị thỏa mãn statusFilter và searchQuery
      group.visibleOrders = group.allDateOrders.filter(o => {
        // Status filter
        if (statusFilter !== 'all' && o.status !== statusFilter) {
          return false;
        }

        // Search query
        if (rawSearch) {
          const idMatch = (o.id || '').toLowerCase().includes(rawSearch);
          const nameMatch = removeVietnameseTones(o.customerName).includes(normalizedSearch);
          const phoneMatch = (o.phone || '').includes(rawSearch) || (o.recipientPhone || '').includes(rawSearch);
          const prodMatch = removeVietnameseTones(o.productName).includes(normalizedSearch);
          if (!idMatch && !nameMatch && !phoneMatch && !prodMatch) {
            return false;
          }
        }
        return true;
      });

      // Thống kê toàn diện từng ngày từ allDateOrders
      let dailyBouquets = 0;
      let pendingCount = 0;
      let readyCount = 0;
      let completedCount = 0;
      let cancelledCount = 0;
      let totalAmount = 0;

      group.allDateOrders.forEach(o => {
        const qty = parseInt(o.quantity, 10) || 1;
        if (o.status !== 'cancelled') {
          dailyBouquets += qty;
          totalAmount += (parseInt(o.totalAmount, 10) || 0);
        }
        if (o.status === 'pending') pendingCount++;
        else if (o.status === 'ready') readyCount++;
        else if (o.status === 'completed') completedCount++;
        else if (o.status === 'cancelled') cancelledCount++;
      });

      group.metrics = {
        totalOrders: group.allDateOrders.length,
        totalBouquets: dailyBouquets,
        pendingCount,
        readyCount,
        completedCount,
        cancelledCount,
        totalAmount
      };
    });

    // Chỉ giữ lại các nhóm ngày có đơn hàng hiển thị
    const activeGroups = Object.values(dateMap).filter(g => g.visibleOrders.length > 0);

    // Sắp xếp ngày theo trình tự thời gian
    return activeGroups.sort((a, b) => {
      const parseDate = (d) => {
        const parts = d.split('/').map(Number);
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
        return new Date(9999, 0, 1);
      };
      try { return parseDate(a.date) - parseDate(b.date); } catch { return 0; }
    });
  }, [dateFilteredOrders, statusFilter, searchQuery]);

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

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setFilterMode('default');
    setStartDate('');
    setEndDate('');
  };

  return (
    <section className="view-section active" id="timelineView">
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
          Sắp xếp các đơn hoa theo <strong>Ngày giao</strong> và <strong>Khung giờ hẹn lấy</strong> giúp thợ hoa chủ động cắm theo thứ tự, hoa luôn tươi mới nhất khi khách nhận.
        </p>
      </div>

      {/* Date Filter & Control Toolbar */}
      <div className="timeline-filter-bar">
        {/* Row 1: Date Filter Pills & Date Range Picker */}
        <div className="timeline-filter-row">
          <div className="timeline-filter-pills">
            <button
              type="button"
              className={`timeline-pill ${filterMode === 'default' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('default');
                setStartDate('');
                setEndDate('');
              }}
              title="Mặc định: Chỉ xem lịch cắm hoa Hôm nay và Ngày mai"
            >
              <Calendar size={14} />
              <span>Hôm nay &amp; Ngày mai</span>
              <span className="pill-count">{dateCounts.default} đơn · {dateCounts.defaultBouquets} bó</span>
            </button>

            <button
              type="button"
              className={`timeline-pill ${filterMode === 'today' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('today');
                setStartDate('');
                setEndDate('');
              }}
            >
              <span>Hôm nay ({todayStr.slice(0, 5)})</span>
              <span className="pill-count">{dateCounts.today} đơn · {dateCounts.todayBouquets} bó</span>
            </button>

            <button
              type="button"
              className={`timeline-pill ${filterMode === 'tomorrow' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('tomorrow');
                setStartDate('');
                setEndDate('');
              }}
            >
              <span>Ngày mai ({tomorrowStr.slice(0, 5)})</span>
              <span className="pill-count">{dateCounts.tomorrow} đơn · {dateCounts.tomorrowBouquets} bó</span>
            </button>

            <button
              type="button"
              className={`timeline-pill ${filterMode === 'oct20' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('oct20');
                setStartDate('');
                setEndDate('');
              }}
              style={{ color: filterMode === 'oct20' ? '#ffffff' : '#b45309' }}
            >
              <Flame size={14} color={filterMode === 'oct20' ? '#ffffff' : '#f97316'} />
              <span>Đợt 20/10</span>
              <span className="pill-count">{dateCounts.oct20} đơn · {dateCounts.oct20Bouquets} bó</span>
            </button>

            <button
              type="button"
              className={`timeline-pill ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('all');
                setStartDate('');
                setEndDate('');
              }}
            >
              <span>Tất cả ngày</span>
              <span className="pill-count">{dateCounts.all} đơn · {dateCounts.allBouquets} bó</span>
            </button>
          </div>

          {/* Date Range Picker */}
          <div className="date-range-picker" title="Lọc tiến độ theo khoảng ngày giao hoa">
            <DatePicker
              label="Từ:"
              value={startDate}
              onChange={(dmy) => {
                setStartDate(dmy);
                setFilterMode(dmy || endDate ? 'custom' : 'default');
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
                setFilterMode(startDate || dmy ? 'custom' : 'default');
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
                  setFilterMode('default');
                }}
                title="Xóa lọc khoảng ngày"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Filter Tabs & Instant Search Box */}
        <div className="timeline-toolbar-sub">
          <div className="timeline-status-pills">
            <button
              type="button"
              className={`timeline-status-pill ${statusFilter === 'all' ? 'active' : ''}`}
              data-status="all"
              onClick={() => setStatusFilter('all')}
              title="Xem tất cả trạng thái đơn"
            >
              <span>Tất cả</span>
              <span className="pill-count">{macroSummary.totalOrders}</span>
            </button>

            <button
              type="button"
              className={`timeline-status-pill ${statusFilter === 'pending' ? 'active' : ''}`}
              data-status="pending"
              onClick={() => setStatusFilter('pending')}
              title="Chỉ xem đơn đang chờ cắm hoa"
            >
              <Clock size={12} />
              <span>Chờ cắm</span>
              <span className="pill-count">{macroSummary.pendingCount}</span>
            </button>

            <button
              type="button"
              className={`timeline-status-pill ${statusFilter === 'ready' ? 'active' : ''}`}
              data-status="ready"
              onClick={() => setStatusFilter('ready')}
              title="Chỉ xem đơn đã bó xong, chờ giao"
            >
              <Sparkles size={12} />
              <span>Đã cắm xong</span>
              <span className="pill-count">{macroSummary.readyCount}</span>
            </button>

            <button
              type="button"
              className={`timeline-status-pill ${statusFilter === 'completed' ? 'active' : ''}`}
              data-status="completed"
              onClick={() => setStatusFilter('completed')}
              title="Chỉ xem đơn đã giao thành công"
            >
              <CheckCircle2 size={12} />
              <span>Đã giao</span>
              <span className="pill-count">{macroSummary.completedCount}</span>
            </button>

            <button
              type="button"
              className={`timeline-status-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
              data-status="cancelled"
              onClick={() => setStatusFilter('cancelled')}
              title="Chỉ xem đơn đã hủy"
            >
              <AlertCircle size={12} />
              <span>Đã hủy</span>
              <span className="pill-count">{macroSummary.cancelledCount}</span>
            </button>
          </div>

          {/* Quick Search Box */}
          <div className="timeline-search-box">
            <Search size={15} className="timeline-search-icon" />
            <input
              type="text"
              className="timeline-search-input"
              placeholder="Tìm mã đơn, tên khách, SĐT, mẫu hoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="timeline-search-clear"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Macro Summary Banner for Current Filter View */}
      {dateFilteredOrders.length > 0 && (
        <div className="timeline-macro-summary">
          <div className="macro-item total">
            <Package size={15} />
            <span>Tổng: <strong>{macroSummary.totalBouquets} bó</strong> ({macroSummary.totalOrders} đơn)</span>
          </div>
          <div className="macro-divider" />
          <div className="macro-item pending">
            <Clock size={13} />
            <span>Chờ cắm: <strong>{macroSummary.pendingCount}</strong></span>
          </div>
          <div className="macro-divider" />
          <div className="macro-item ready">
            <Sparkles size={13} />
            <span>Đã cắm: <strong>{macroSummary.readyCount}</strong></span>
          </div>
          <div className="macro-divider" />
          <div className="macro-item completed">
            <CheckCircle2 size={13} />
            <span>Đã giao: <strong>{macroSummary.completedCount}</strong></span>
          </div>
          {macroSummary.cancelledCount > 0 && (
            <>
              <div className="macro-divider" />
              <div className="macro-item cancelled">
                <AlertCircle size={13} />
                <span>Đã hủy: <strong>{macroSummary.cancelledCount}</strong></span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Timeline Container */}
      <div id="timelineContainer">
        {grouped.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'var(--text-muted)',
            background: 'var(--bg-surface)',
            borderRadius: 12,
            border: '1px dashed var(--border-color)'
          }}>
            <Calendar size={36} color="var(--primary)" style={{ opacity: 0.6, marginBottom: 10 }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
              {searchQuery
                ? `Không tìm thấy đơn hàng nào khớp với từ khóa "${searchQuery}"`
                : statusFilter !== 'all'
                ? `Không có đơn hàng nào ở trạng thái "${getStatusInfo(statusFilter).label}" trong khoảng ngày đã chọn`
                : filterMode === 'default'
                ? `Không có đơn hoa nào hẹn lấy trong Hôm nay (${todayStr}) và Ngày mai (${tomorrowStr})`
                : filterMode === 'custom'
                ? `Không có đơn hoa nào hẹn giao ${startDate && endDate ? `từ ngày ${startDate} đến ngày ${endDate}` : startDate ? `từ ngày ${startDate}` : endDate ? `đến ngày ${endDate}` : 'trong khoảng ngày đã chọn'}`
                : 'Không có đơn hàng nào phù hợp với bộ lọc'}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {searchQuery || statusFilter !== 'all'
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn xem Tất cả trạng thái đơn.'
                : 'Bạn có thể chọn xem đợt cao điểm 20/10 hoặc xem tất cả các ngày khác trong hệ thống.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(searchQuery || statusFilter !== 'all' || filterMode !== 'default') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={13} />
                  <span>Khôi phục bộ lọc mặc định</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setFilterMode('all');
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Xem tất cả các ngày ({dateCounts.all} đơn)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFilterMode('oct20');
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                <Flame size={13} color="#f97316" />
                <span>Xem đợt 20/10 ({dateCounts.oct20} đơn)</span>
              </button>
            </div>
          </div>
        )}

        {grouped.map(({ date, metrics, visibleOrders }) => {
          const sorted = sortByTime(visibleOrders);
          const peak = isPeakDay(date);

          return (
            <div key={date} className="timeline-day-group" style={{ marginBottom: 28 }}>
              {/* Date Header with Comprehensive Daily KPI Chips */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14,
                padding: '12px 18px',
                background: peak ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.9), rgba(253, 230, 138, 0.8))' : 'var(--bg-muted)',
                borderRadius: 12, borderLeft: `4px solid ${peak ? '#f59e0b' : 'var(--primary)'}`,
                boxShadow: 'var(--shadow-sm)',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {peak ? (
                    <Flame size={20} color="#b45309" />
                  ) : (
                    <Calendar size={18} color="var(--primary)" />
                  )}
                  <div>
                    <strong style={{ fontSize: 15, color: peak ? '#92400e' : 'var(--text-main)' }}>
                      {date} {peak && '— Ngày Phụ Nữ Việt Nam 20/10'}
                    </strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {metrics.totalOrders} đơn hàng · {formatMoney(metrics.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Daily KPI Summary Chips */}
                <div className="daily-kpi-chips">
                  <span className="daily-kpi-chip bouquets" title="Tổng số lượng hoa cần cắm trong ngày">
                    <Package size={13} color="var(--primary)" />
                    <span>Tổng: <strong style={{ color: peak ? '#b45309' : 'var(--primary)' }}>{metrics.totalBouquets} bó</strong></span>
                  </span>

                  <span className="daily-kpi-chip pending" title="Đơn đang chờ thợ cắm hoa">
                    <Clock size={12} />
                    <span>{metrics.pendingCount} chờ cắm</span>
                  </span>

                  <span className="daily-kpi-chip ready" title="Đơn đã cắm xong, sẵn sàng giao">
                    <Sparkles size={12} />
                    <span>{metrics.readyCount} đã cắm</span>
                  </span>

                  <span className="daily-kpi-chip completed" title="Đơn đã giao thành công">
                    <CheckCircle2 size={12} />
                    <span>{metrics.completedCount} đã giao</span>
                  </span>

                  {metrics.cancelledCount > 0 && (
                    <span className="daily-kpi-chip cancelled" title="Đơn đã bị hủy">
                      <AlertCircle size={12} />
                      <span>{metrics.cancelledCount} đã hủy</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Orders for this date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map((o, orderIndex) => {
                  const { className: statusClass } = getStatusInfo(o.status);
                  const hasImages = o.images && o.images.length > 0;
                  const qty = parseInt(o.quantity, 10) || 1;
                  const isCancelled = o.status === 'cancelled';

                  return (
                    <div key={o.id} className="timeline-order-card" style={{
                      display: 'flex', flexWrap: 'wrap', gap: 12, padding: '14px 16px',
                      background: 'var(--bg-surface)', borderRadius: 12,
                      border: isCancelled ? '1px dashed #fca5a5' : '1px solid var(--border-color)',
                      opacity: isCancelled ? 0.65 : o.status === 'completed' ? 0.8 : 1,
                      alignItems: 'flex-start',
                    }}>
                      {/* Time Column */}
                      <div style={{ minWidth: 64, textAlign: 'center', padding: '6px 8px', background: 'var(--bg-app)', borderRadius: 8, flexShrink: 0 }}>
                        {o.deliveryTime ? (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 700, color: isCancelled ? 'var(--text-muted)' : 'var(--primary)' }}>
                              {o.deliveryTime}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>giờ hẹn</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</div>
                        )}
                      </div>

                      {/* Photo Thumbnail */}
                      <div
                        className={`timeline-photo-thumbnail ${hasImages ? 'has-image' : 'empty'}`}
                        onClick={() => onOpenGallery && onOpenGallery({ order: o, initialIndex: 0 })}
                        role="button"
                        tabIndex={0}
                        title={hasImages ? `Xem ${o.images.length} ảnh mẫu hoa của đơn ${o.id}` : `Chụp hoặc thêm ảnh mẫu cho đơn ${o.id}`}
                        style={{ flexShrink: 0 }}
                      >
                        {hasImages ? (
                          <>
                            <img src={o.images[0]} alt={`Mẫu hoa ${o.productName}`} />
                            {o.images.length > 1 && (
                              <span className="photo-count-badge">
                                <Images size={10} />
                                <span>{o.images.length}</span>
                              </span>
                            )}
                            <div className="photo-zoom-hint">
                              <Maximize2 size={12} />
                            </div>
                          </>
                        ) : (
                          <div className="photo-empty-inner">
                            <Camera size={16} />
                            <span>+ Ảnh</span>
                          </div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div style={{ flex: '1 1 240px', minWidth: 220 }}>
                        {/* Header Row: STT, Order ID, Quantity Badge, Quick Status Changer */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span className="order-stt-badge" style={{ margin: 0, fontWeight: 800 }}>
                            #{orderIndex + 1}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isCancelled ? 'var(--text-muted)' : 'var(--primary)' }}>
                            {o.id}
                          </span>

                          {/* Prominent Quantity Badge */}
                          <span
                            className={`timeline-qty-badge ${qty > 1 ? 'multiple' : 'single'}`}
                            title={qty > 1 ? `Đơn hàng gồm ${qty} bó hoa - Lưu ý cắm đủ số lượng!` : `Đơn 1 bó hoa`}
                          >
                            <Package size={12} />
                            <span>SL: {qty} {qty > 1 ? 'BÓ (LƯU Ý!)' : 'bó'}</span>
                          </span>

                          <select
                            className={`status-badge ${statusClass}`}
                            value={o.status}
                            onChange={e => handleStatusChange(o, e.target.value)}
                            style={{
                              border: 'none',
                              cursor: 'pointer',
                              appearance: 'auto',
                              fontSize: 11.5,
                              padding: '3px 8px',
                              fontWeight: 600,
                              borderRadius: 8
                            }}
                            title="Bấm để đổi nhanh trạng thái đơn hàng"
                          >
                            <option value="pending">Chờ cắm hoa</option>
                            <option value="ready">Đã bó xong</option>
                            <option value="completed">Đã giao</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                        </div>

                        {/* Customer Info */}
                        <div style={{ fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>
                            {o.customerName}
                          </span>
                          {o.phone && (
                            <a
                              href={`tel:${o.phone}`}
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: 'var(--primary)',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                              title="Bấm để gọi khách"
                            >
                              <Phone size={11} />
                              <span>{o.phone}</span>
                            </a>
                          )}
                          {o.assignedUserName && (
                            <span style={{ fontSize: 11, background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }} title="Người tiếp nhận & xử lý đơn">
                              <UserCheck size={10} />
                              <span>{o.assignedUserName}</span>
                            </span>
                          )}
                        </div>

                        {/* Flower Product Name & Quantity */}
                        <div style={{ fontSize: 13.5, color: 'var(--text-main)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, flexWrap: 'wrap' }}>
                          <Flower2 size={14} color="var(--primary)" />
                          <span style={{ fontWeight: 700, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                            {o.productName}
                          </span>
                          <span className={`timeline-qty-badge ${qty > 1 ? 'multiple' : 'single'}`}>
                            {qty > 1 ? `Số lượng: ${qty} bó` : '1 bó hoa'}
                          </span>
                        </div>

                        {/* Ghi chú làm hoa - Highlight Box */}
                        {o.notes && (
                          <div className="timeline-note-box order-note">
                            <FileText size={14} className="note-icon" />
                            <div>
                              <strong>Ghi chú làm hoa:</strong>
                              <span>{o.notes}</span>
                            </div>
                          </div>
                        )}

                        {/* Nội dung thiệp / Banner - Highlight Box */}
                        {o.cardMessage && (
                          <div className="timeline-note-box card-message">
                            <MessageSquare size={14} className="note-icon" />
                            <div>
                              <strong>Nội dung thiệp:</strong>
                              <span>"{o.cardMessage}"</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Money & Delivery Column */}
                      <div style={{ textAlign: 'right', marginLeft: 'auto', minWidth: 100, flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isCancelled ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                          {formatMoney(o.totalAmount)}
                        </div>
                        {o.remainingAmount > 0 && !isCancelled && (
                          <div style={{ fontSize: 11.5, color: '#e11d48', marginTop: 2, fontWeight: 700 }}>
                            Còn: {formatMoney(o.remainingAmount)}
                          </div>
                        )}
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {o.deliveryType === 'Giao hàng / Book ship' ? (
                            <>
                              <Truck size={12} />
                              <span>Ship</span>
                            </>
                          ) : (
                            <>
                              <Store size={12} />
                              <span>Tự lấy</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

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

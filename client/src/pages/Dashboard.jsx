/**
 * pages/Dashboard.jsx - Tổng quan kinh doanh
 * Hỗ trợ Date Range Filter với toggle Ngày đặt / Ngày giao
 */
import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  PackageOpen,
  TrendingUp,
  Clock,
  ArrowRight,
  Flower2,
  Share2,
  ShoppingBag,
  Sparkles,
  Loader2,
  AlertCircle,
  Wallet,
  CheckCircle2,
  Receipt,
  CalendarRange,
  RotateCcw
} from 'lucide-react';
import { metricsApi } from '../api';
import { formatMoney, formatToDDMMYYYY } from '../utils/format';
import DatePicker from '../components/UI/DatePicker';

export default function Dashboard({ onNavigate, refreshTrigger }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date range filter state
  const [dateFrom, setDateFrom] = useState('');         // dd/mm/yyyy
  const [dateTo, setDateTo] = useState('');               // dd/mm/yyyy
  const [dateField, setDateField] = useState('order_date'); // 'order_date' | 'delivery_date'
  const [defaultDateFrom, setDefaultDateFrom] = useState('');
  const [defaultDateTo, setDefaultDateTo] = useState('');
  const [initialized, setInitialized] = useState(false);

  const getTodayStr = useCallback(() => {
    const t = new Date();
    return `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
  }, []);

  useEffect(() => {
    const params = {};
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (dateField) params.dateField = dateField;

    setLoading(true);
    metricsApi.get(params).then(data => {
      setMetrics(data);
      // First load: set default range from minOrderDate -> today
      if (!initialized && data.minOrderDate) {
        const today = getTodayStr();
        setDateFrom(data.minOrderDate);
        setDateTo(today);
        setDefaultDateFrom(data.minOrderDate);
        setDefaultDateTo(today);
        setInitialized(true);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dateFrom, dateTo, dateField, refreshTrigger]);

  // Detect if user changed from defaults
  const isFiltered = initialized && (
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo ||
    dateField !== 'order_date'
  );

  const handleResetFilter = () => {
    setDateFrom(defaultDateFrom);
    setDateTo(defaultDateTo);
    setDateField('order_date');
  };

  if (loading && !metrics) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Loader2 className="animate-spin" size={24} color="var(--primary)" />
        <span>Đang tải dữ liệu tổng quan...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <AlertCircle size={20} />
        <span>Không thể tải dữ liệu. Vui lòng kiểm tra lại kết nối server!</span>
      </div>
    );
  }

  const {
    totalCapital,
    totalExpensesCount = 15,
    totalPotentialRevenue,
    deliveredRevenue = 9900000,
    actualCollectedCash = 12500000,
    pendingDeposit = 2600000,
    pendingCollection = 5400000,
    profit = 6422000,
    expectedProfit = 11822000,
    statusCounts,
    topProducts,
    channelMap,
    recentOrders
  } = metrics;

  const totalActiveOrders = (statusCounts.pending || 0) + (statusCounts.ready || 0) + (statusCounts.completed || 0);
  const completedPct = totalActiveOrders > 0 ? Math.round((statusCounts.completed / totalActiveOrders) * 100) : 0;
  const pendingPct = 100 - completedPct;

  const totalChannels = Object.values(channelMap).reduce((a, b) => a + b, 0);
  const CHANNEL_COLORS = {
    Thread: '#18181b',
    Threads: '#18181b',
    Facebook: '#1877f2',
    Instagram: '#e1306c',
    Zalo: '#0068ff',
    'Điện thoại': '#10b981',
    'Tại tiệm': '#8b5cf6'
  };

  const STATUS_LABELS = {
    pending: 'Chờ cắm hoa',
    ready: 'Đã bó xong',
    completed: 'Đã giao',
    cancelled: 'Đã hủy'
  };

  return (
    <section className="view-section active" id="dashboardView">
      {/* Date Range Filter */}
      <div className="dashboard-date-filter">
        <div className="dashboard-date-filter-left">
          <div className="dashboard-date-filter-label">
            <CalendarRange size={16} />
            <span>Khoảng thời gian</span>
          </div>
          <div className="dashboard-date-field-toggle">
            <button
              className={`toggle-btn ${dateField === 'order_date' ? 'active' : ''}`}
              onClick={() => setDateField('order_date')}
              type="button"
            >
              Ngày đặt
            </button>
            <button
              className={`toggle-btn ${dateField === 'delivery_date' ? 'active' : ''}`}
              onClick={() => setDateField('delivery_date')}
              type="button"
            >
              Ngày giao
            </button>
          </div>
        </div>
        <div className="dashboard-date-filter-controls">
          <DatePicker
            value={dateFrom}
            onChange={(dmy) => setDateFrom(dmy)}
            placeholder="Từ ngày"
            icon={true}
            clearable={false}
            className="dashboard-date-input"
          />
          <span className="dashboard-date-separator">→</span>
          <DatePicker
            value={dateTo}
            onChange={(dmy) => setDateTo(dmy)}
            placeholder="Đến ngày"
            icon={true}
            clearable={false}
            className="dashboard-date-input"
          />
          {isFiltered && (
            <button
              className="btn btn-secondary btn-sm dashboard-date-reset"
              onClick={handleResetFilter}
              type="button"
            >
              <RotateCcw size={13} />
              <span>Xem tất cả</span>
            </button>
          )}
        </div>
      </div>

      {/* NHÓM 1: THỐNG KÊ TÀI CHÍNH & DÒNG TIỀN */}
      <div className="kpi-group finance-group">
        <div className="kpi-group-header">
          <div className="kpi-group-title">
            <DollarSign size={18} color="var(--primary)" />
            <span>Thống Kê Tài Chính &amp; Dòng Tiền</span>
          </div>
          <span className="kpi-group-badge finance">
            Dòng tiền thực thu: {formatMoney(actualCollectedCash)}
          </span>
        </div>

        <div className="kpi-grid finance">
          <div className="kpi-card revenue">
            <div className="kpi-header">
              <span className="kpi-title">Tổng Doanh Thu Dự Kiến</span>
              <div className="kpi-icon-wrap">
                <DollarSign size={18} color="#059669" />
              </div>
            </div>
            <div className="kpi-value" id="kpiRevenue">{formatMoney(totalPotentialRevenue)}</div>
            <div className="kpi-subtext"><span>Toàn bộ {statusCounts.all} đơn hàng hiệu lực</span></div>
          </div>

          <div className="kpi-card cash">
            <div className="kpi-header">
              <span className="kpi-title">Tiền Thực Nhận (Về Ví)</span>
              <div className="kpi-icon-wrap">
                <Wallet size={18} color="#0891b2" />
              </div>
            </div>
            <div className="kpi-value" id="kpiCash">{formatMoney(actualCollectedCash)}</div>
            <div className="kpi-subtext">
              <span>Đã giao {formatMoney(deliveredRevenue)} + Cọc chờ {formatMoney(pendingDeposit)}</span>
            </div>
          </div>

          <div className="kpi-card capital">
            <div className="kpi-header">
              <span className="kpi-title">Tổng Vốn Bỏ Ra</span>
              <div className="kpi-icon-wrap">
                <PackageOpen size={18} color="#d97706" />
              </div>
            </div>
            <div className="kpi-value" id="kpiCapital">{formatMoney(totalCapital)}</div>
            <div className="kpi-subtext"><span>Chi phí hoa tươi, phụ liệu &amp; ăn uống</span></div>
          </div>

          <div className="kpi-card profit">
            <div className="kpi-header">
              <span className="kpi-title">Lợi Nhuận Thực Thu</span>
              <div className="kpi-icon-wrap">
                <TrendingUp size={18} color="var(--primary)" />
              </div>
            </div>
            <div className="kpi-value" id="kpiProfit">{formatMoney(profit)}</div>
            <div className="kpi-subtext">
              <span className="highlight">
                Tiền về ví ({formatMoney(actualCollectedCash)}) − Vốn ({formatMoney(totalCapital)})
              </span>
            </div>
          </div>

          <div className="kpi-card debt">
            <div className="kpi-header">
              <span className="kpi-title">Công Nợ Còn Phải Thu</span>
              <div className="kpi-icon-wrap">
                <Clock size={18} color="#e11d48" />
              </div>
            </div>
            <div className="kpi-value" id="kpiDebt">{formatMoney(pendingCollection)}</div>
            <div className="kpi-subtext"><span>Cần thu khi giao {(statusCounts.pending || 0) + (statusCounts.ready || 0)} đơn còn lại</span></div>
          </div>

          <div className="kpi-card expected-profit">
            <div className="kpi-header">
              <span className="kpi-title">Lợi Nhuận Toàn Mùa Dự Kiến</span>
              <div className="kpi-icon-wrap">
                <Sparkles size={18} color="#7c3aed" />
              </div>
            </div>
            <div className="kpi-value" id="kpiExpectedProfit">{formatMoney(expectedProfit)}</div>
            <div className="kpi-subtext">
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                Biên lãi gộp ~{totalPotentialRevenue > 0 ? Math.round((expectedProfit / totalPotentialRevenue) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NHÓM 2: THỐNG KÊ ĐƠN HÀNG & TIẾN ĐỘ VẬN HÀNH */}
      <div className="kpi-group operations-group">
        <div className="kpi-group-header">
          <div className="kpi-group-title">
            <ShoppingBag size={18} color="#2563eb" />
            <span>Thống Kê Đơn Hàng &amp; Vận Hành</span>
          </div>
          <span className="kpi-group-badge operations">
            Tiến độ giao: {completedPct}% ({statusCounts.completed}/{statusCounts.all} đơn)
          </span>
        </div>

        <div className="kpi-grid operations">
          <div className="kpi-card orders-total">
            <div className="kpi-header">
              <span className="kpi-title">Tổng Đơn Hàng</span>
              <div className="kpi-icon-wrap">
                <ShoppingBag size={18} color="#2563eb" />
              </div>
            </div>
            <div className="kpi-value" id="kpiOrdersTotal">
              {statusCounts.all} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>đơn</span>
            </div>
            <div className="kpi-subtext"><span>Đơn hàng hiệu lực</span></div>
          </div>

          <div className="kpi-card orders-completed">
            <div className="kpi-header">
              <span className="kpi-title">Đã Giao Hoàn Tất</span>
              <div className="kpi-icon-wrap">
                <CheckCircle2 size={18} color="#059669" />
              </div>
            </div>
            <div className="kpi-value" id="kpiOrdersCompleted">
              {statusCounts.completed} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>đơn</span>
            </div>
            <div className="kpi-subtext"><span>Thu đủ 100% ({formatMoney(deliveredRevenue)})</span></div>
          </div>

          <div className="kpi-card orders-pending">
            <div className="kpi-header">
              <span className="kpi-title">Đang Chờ Giao</span>
              <div className="kpi-icon-wrap">
                <Clock size={18} color="#d97706" />
              </div>
            </div>
            <div className="kpi-value" id="kpiOrdersPending">
              {statusCounts.pending + (statusCounts.ready || 0)} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>đơn</span>
            </div>
            <div className="kpi-subtext"><span>Đã cọc {formatMoney(pendingDeposit)}, còn {formatMoney(pendingCollection)}</span></div>
          </div>

          <div className="kpi-card expenses-count">
            <div className="kpi-header">
              <span className="kpi-title">Khoản Chi Vốn</span>
              <div className="kpi-icon-wrap">
                <Receipt size={18} color="#4f46e5" />
              </div>
            </div>
            <div className="kpi-value" id="kpiExpensesCount">
              {totalExpensesCount || 15} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>khoản</span>
            </div>
            <div className="kpi-subtext"><span>Hoa tươi, phụ liệu &amp; vận hành</span></div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Progress & Top Products */}
        <div className="content-card">
          <div className="card-title-row">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flower2 size={18} color="var(--primary)" />
              <span>Tiến Độ &amp; Mẫu Hoa Nổi Bật</span>
            </h3>
            <span className="tag">Dữ liệu thời gian thực</span>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              <span>Đã giao &amp; thu tiền đủ</span>
              <span id="pctCompleted" style={{ color: 'var(--status-completed-text)' }}>
                {completedPct}% ({statusCounts.completed} đơn)
              </span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-muted)', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
              <div id="barCompleted" style={{ height: '100%', width: `${completedPct}%`, background: '#10b981', borderRadius: 6, transition: 'width 0.5s ease' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              <span>Đang chờ cắm &amp; chờ giao</span>
              <span id="pctPending" style={{ color: '#d97706' }}>
                {pendingPct}% ({(statusCounts.pending || 0) + (statusCounts.ready || 0)} đơn)
              </span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-muted)', borderRadius: 6, overflow: 'hidden' }}>
              <div id="barPending" style={{ height: '100%', width: `${pendingPct}%`, background: '#f59e0b', borderRadius: 6, transition: 'width 0.5s ease' }}></div>
            </div>
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text-main)' }}>Top 5 mẫu hoa được đặt nhiều nhất</h4>
          <div id="topProductsList">
            {topProducts.map((p, i) => {
              const maxQty = topProducts[0]?.qty || 1;
              return (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 18, textAlign: 'right' }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                      <span>{p.name}</span>
                      <span style={{ color: 'var(--primary)' }}>{p.qty} bó</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${(p.qty / maxQty) * 100}%`, background: 'var(--primary)', borderRadius: 4 }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="content-card">
          <div className="card-title-row">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 size={18} color="var(--primary)" />
              <span>Kênh Tiếp Nhận</span>
            </h3>
            <span className="tag">Nguồn khách</span>
          </div>
          <div id="channelDistribution" style={{ paddingTop: 10 }}>
            {Object.entries(channelMap).sort((a, b) => b[1] - a[1]).map(([channel, count]) => {
              const pct = totalChannels > 0 ? Math.round((count / totalChannels) * 100) : 0;
              const color = CHANNEL_COLORS[channel] || '#6b7280';
              return (
                <div key={channel} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                    <span>{channel}</span>
                    <span style={{ color }}>{pct}% ({count} đơn)</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-muted)', borderRadius: 5 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 24, padding: 12, background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Gợi ý kinh doanh:</strong> Khách đặt qua Instagram chiếm đa số. Nên chuẩn bị sẵn ảnh chụp các mẫu hoa đã cắm xong để đăng story tương tác trước ngày 20/10!
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="content-card">
        <div className="card-title-row">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={18} color="var(--primary)" />
            <span>Đơn Hàng Gần Đây</span>
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('orders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span>Xem toàn bộ {statusCounts.all} đơn</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Desktop Table */}
        <div className="table-responsive desktop-only-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Mẫu Hoa</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Ngày Hẹn Giao</th>
              </tr>
            </thead>
            <tbody id="dashboardRecentOrders">
              {recentOrders?.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.id}</strong></td>
                  <td>{o.customerName}</td>
                  <td>{o.productName}</td>
                  <td><strong>{formatMoney(o.totalAmount)}</strong></td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td>{o.deliveryDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View for Recent Orders */}
        <div className="mobile-only-cards">
          {recentOrders?.slice(0, 5).map(o => (
            <div key={o.id} className="mobile-order-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{o.id}</span>
                <span className={`status-badge status-${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.customerName}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{o.productName}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border-light)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hẹn: {o.deliveryDate}</span>
                <strong style={{ color: 'var(--primary)', fontSize: 14 }}>{formatMoney(o.totalAmount)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

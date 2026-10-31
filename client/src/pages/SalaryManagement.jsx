/**
 * pages/SalaryManagement.jsx - Quản lý & Bảng tính lương theo ngày
 * Phân chia lợi nhuận theo tỷ lệ linh hoạt, thống kê số đơn tiếp nhận của từng người
 * BẢO MẬT: Chỉ Admin & Quản lý (Manager) mới có quyền truy cập
 * Tuân thủ quy tắc AGENTS.md: Lucide icons only (no emoji), responsive mobile/tablet/desktop, no-zoom inputs
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  Calendar,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Settings,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Wallet,
  Clock,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { salaryApi } from '../api';
import { formatMoney } from '../utils/format';
import DatePicker from '../components/UI/DatePicker';
import SalaryConfigModal from '../components/Modals/SalaryConfigModal';
import DailyAllocationModal from '../components/Modals/DailyAllocationModal';

function getTodayDMY() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function SalaryManagement({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickDate, setQuickDate] = useState('all'); // 'all' | 'today' | 'last7' | 'thisMonth'
  const [dateField, setDateField] = useState('order_date'); // 'order_date' | 'delivery_date'
  const [searchUser, setSearchUser] = useState('');

  // Modals state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState(null);

  // Fetch overview data
  const fetchSalaryOverview = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        from: startDate || undefined,
        to: endDate || undefined,
        dateField
      };
      const res = await salaryApi.getOverview(params);
      setData(res);
    } catch (err) {
      showToast?.(err.response?.data?.error || 'Lỗi tải dữ liệu bảng lương', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, dateField, showToast]);

  useEffect(() => {
    fetchSalaryOverview();
  }, [fetchSalaryOverview]);

  // Handle Quick Date Selection
  const handleQuickDateSelect = (type) => {
    setQuickDate(type);
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const today = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    if (type === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'last7') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      const pastStr = `${pad(past.getDate())}/${pad(past.getMonth() + 1)}/${past.getFullYear()}`;
      setStartDate(pastStr);
      setEndDate(today);
    } else if (type === 'thisMonth') {
      const firstDay = `01/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      setStartDate(firstDay);
      setEndDate(today);
    }
  };

  // Filtered User Summaries
  const filteredUserSummaries = useMemo(() => {
    if (!data?.userSummaries) return [];
    if (!searchUser.trim()) return data.userSummaries;
    const q = searchUser.trim().toLowerCase();
    return data.userSummaries.filter(
      u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [data?.userSummaries, searchUser]);

  return (
    <div className="orders-container salary-management-page">
      {/* Page Header */}
      <div className="orders-header">
        <div className="orders-title-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="header-icon-box" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
              <DollarSign size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>
                Quản Lý &amp; Bảng Lương
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Tính lương chia theo lợi nhuận ngày, điều chỉnh tỷ lệ và thống kê đơn đã xử lý
              </p>
            </div>
          </div>
        </div>

        <div className="orders-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setConfigModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Chọn ai trong hệ thống sẽ tham gia nhận lương chia theo ngày"
          >
            <Users size={16} />
            <span>Cài Đặt Nhân Sự Tính Lương</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="orders-filter-bar" style={{ gap: 14 }}>
        <div className="filter-date-controls" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* Quick Date Pills */}
          <div className="quick-date-pills">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center' }}>
              Khoảng ngày:
            </span>
            <button
              type="button"
              className={`date-pill ${quickDate === 'all' && !startDate && !endDate ? 'active' : ''}`}
              onClick={() => handleQuickDateSelect('all')}
            >
              Toàn bộ
            </button>
            <button
              type="button"
              className={`date-pill ${quickDate === 'today' ? 'active' : ''}`}
              onClick={() => handleQuickDateSelect('today')}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className={`date-pill ${quickDate === 'last7' ? 'active' : ''}`}
              onClick={() => handleQuickDateSelect('last7')}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              className={`date-pill ${quickDate === 'thisMonth' ? 'active' : ''}`}
              onClick={() => handleQuickDateSelect('thisMonth')}
            >
              Tháng này
            </button>
          </div>

          {/* Date Range Picker */}
          <div className="date-range-picker" title="Lọc dữ liệu theo khoảng ngày">
            <DatePicker
              label="Từ:"
              value={startDate}
              onChange={(dmy) => {
                setStartDate(dmy);
                setQuickDate('custom');
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
                setQuickDate('custom');
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
                  setQuickDate('all');
                }}
                title="Xóa lọc khoảng ngày"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Base Date Selector Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-app)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)', gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', padding: '0 6px' }}>Căn cứ theo:</span>
            <button
              type="button"
              onClick={() => setDateField('order_date')}
              style={{
                fontSize: 12,
                fontWeight: dateField === 'order_date' ? 700 : 500,
                background: dateField === 'order_date' ? 'var(--bg-surface)' : 'transparent',
                color: dateField === 'order_date' ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                boxShadow: dateField === 'order_date' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Ngày đặt đơn
            </button>
            <button
              type="button"
              onClick={() => setDateField('delivery_date')}
              style={{
                fontSize: 12,
                fontWeight: dateField === 'delivery_date' ? 700 : 500,
                background: dateField === 'delivery_date' ? 'var(--bg-surface)' : 'transparent',
                color: dateField === 'delivery_date' ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                boxShadow: dateField === 'delivery_date' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Ngày giao hàng
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="orders-summary-bar">
        <div className="summary-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {/* Card 1: Tổng lợi nhuận */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon orders" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <TrendingUp size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">Tổng Lợi Nhuận Kỳ</span>
              <span className="summary-stat-value" style={{ color: (data?.kpis?.totalProfit || 0) >= 0 ? 'var(--status-completed-text)' : '#e11d48' }}>
                {loading ? '...' : formatMoney(data?.kpis?.totalProfit || 0)}
              </span>
            </div>
          </div>

          {/* Card 2: Tổng quỹ lương */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon paid" style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold)' }}>
              <DollarSign size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">Quỹ Lương Đã Chia</span>
              <span className="summary-stat-value">
                {loading ? '...' : formatMoney(data?.kpis?.totalSalaryAllocated || 0)}
              </span>
            </div>
          </div>

          {/* Card 3: Tổng đơn tiếp nhận */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon remain" style={{ background: 'var(--status-ready-bg)', color: 'var(--status-ready-text)' }}>
              <ShoppingBag size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">Tổng Đơn Hàng</span>
              <span className="summary-stat-value">
                {loading ? '...' : `${data?.kpis?.totalOrdersCount || 0} đơn`}
              </span>
            </div>
          </div>

          {/* Card 4: Nhân sự tính lương */}
          <div className="summary-stat-chip">
            <div className="summary-stat-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
              <Users size={18} />
            </div>
            <div className="summary-stat-info">
              <span className="summary-stat-label">Nhân Sự Tính Lương</span>
              <span className="summary-stat-value">
                {loading ? '...' : `${data?.kpis?.activeParticipantsCount || 0} người`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: TỔNG QUAN LƯƠNG & HIỆU SUẤT TỪNG NGƯỜI */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={18} color="var(--primary)" />
              <span>Tổng Quan Lương &amp; Đơn Hàng Theo Từng Người</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Số đơn tiếp nhận, tổng doanh số phụ trách và lương tích lũy trong kỳ lọc
            </p>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm nhân sự..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                fontSize: 13,
                background: 'var(--bg-surface)'
              }}
            />
          </div>
        </div>

        {/* User Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filteredUserSummaries.map(user => {
            return (
              <div
                key={user.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: user.isSalaryEligible ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* User Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="user-avatar-tiny" style={{ width: 40, height: 40, fontSize: 16 }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                        {user.name}
                      </div>
                      <span
                        className={`role-badge role-${user.role}`}
                        style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginTop: 2 }}
                      >
                        {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {user.isSalaryEligible ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--status-completed-text)',
                          background: 'var(--status-completed-bg)',
                          border: '1px solid var(--status-completed-border)',
                          padding: '3px 8px',
                          borderRadius: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        <CheckCircle2 size={11} /> Có tính lương
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                          background: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          padding: '3px 8px',
                          borderRadius: 12
                        }}
                      >
                        Không tính lương
                      </span>
                    )}
                  </div>
                </div>

                {/* Performance & Salary Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px dashed var(--border-light)'
                  }}
                >
                  <div style={{ background: 'var(--bg-app)', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShoppingBag size={12} /> Đơn Tiếp Nhận
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                      {user.orderCount} <span style={{ fontSize: 12, fontWeight: 500 }}>đơn</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatMoney(user.orderTotalAmount)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--primary-subtle)', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarSign size={12} /> Lương Kỳ Này
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: user.totalSalary >= 0 ? 'var(--primary)' : '#e11d48',
                        marginTop: 2
                      }}
                    >
                      {formatMoney(user.totalSalary)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--primary)', opacity: 0.85, marginTop: 2 }}>
                      {user.isSalaryEligible ? 'Chia theo ngày' : 'Chưa tham gia'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: BẢNG NHẬT KÝ THEO NGÀY & NÚT ĐIỀU CHỈNH TỶ LỆ */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="var(--primary)" />
              <span>Nhật Ký Lợi Nhuận &amp; Tỷ Lệ Chia Lương Từng Ngày</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Xem lợi nhuận của từng ngày và bấm "Sửa tỷ lệ" để điều chỉnh tỷ lệ phần trăm theo thực tế
            </p>
          </div>
        </div>

        {/* Daily Breakdown Table for Desktop */}
        <div className="orders-table-wrapper desktop-only-table" style={{ marginTop: 8 }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th style={{ width: 45, textAlign: 'center' }}>STT</th>
                <th>Ngày</th>
                <th style={{ textAlign: 'center' }}>Số Đơn</th>
                <th>Doanh Thu</th>
                <th>Chi Phí</th>
                <th>Lợi Nhuận Ngày</th>
                <th>Trạng Thái Tỷ Lệ</th>
                <th>Phân Bổ Lương Chi Tiết</th>
                <th style={{ textAlign: 'center', width: 110 }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Loader2 size={18} className="animate-spin" color="var(--primary)" />
                      <span>Đang tính toán số liệu lương...</span>
                    </div>
                  </td>
                </tr>
              ) : (data?.dailyBreakdown || []).length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Không có dữ liệu phát sinh trong khoảng thời gian đã chọn
                  </td>
                </tr>
              ) : (
                data.dailyBreakdown.map((day, idx) => {
                  return (
                    <tr key={day.date}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <strong style={{ fontSize: 13.5 }}>{day.date}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="order-qty-tag">{day.orderCount} đơn</span>
                      </td>
                      <td><strong>{formatMoney(day.revenue)}</strong></td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatMoney(day.cost)}</td>
                      <td>
                        <strong style={{ color: day.profit >= 0 ? 'var(--status-completed-text)' : '#e11d48' }}>
                          {formatMoney(day.profit)}
                        </strong>
                      </td>
                      <td>
                        {day.isCustom ? (
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: '#b45309',
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              padding: '2px 8px',
                              borderRadius: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Edit3 size={11} /> Tùy biến Admin
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: 'var(--text-muted)',
                              background: 'var(--bg-app)',
                              padding: '2px 8px',
                              borderRadius: 12
                            }}
                          >
                            Mặc định chia đều
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {day.allocations
                            .filter(a => a.isParticipating)
                            .map(a => (
                              <div
                                key={a.userId}
                                style={{
                                  fontSize: 11.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{a.userName}:</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{a.percentage}%</span>
                                <span style={{ color: 'var(--text-muted)' }}>({formatMoney(a.salary)})</span>
                                {a.notes && (
                                  <span style={{ fontSize: 10.5, color: 'var(--text-light)', fontStyle: 'italic' }}>
                                    • {a.notes}
                                  </span>
                                )}
                              </div>
                            ))}
                          {day.allocations.filter(a => a.isParticipating).length === 0 && (
                            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Chưa có ai nhận
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedDayData(day)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11.5,
                            padding: '4px 10px'
                          }}
                          title="Điều chỉnh tỷ lệ phần trăm cho ngày này"
                        >
                          <Edit3 size={12} />
                          <span>Sửa Tỷ Lệ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View for Daily Breakdown */}
        <div className="mobile-only-cards" style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (data?.dailyBreakdown || []).map((day, idx) => (
            <div
              key={day.date}
              className="mobile-order-card"
              style={{
                borderLeft: day.isCustom ? '4px solid #f59e0b' : '4px solid var(--primary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-main)' }}>{day.date}</span>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{day.orderCount} đơn hàng</div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedDayData(day)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '5px 10px' }}
                >
                  <Edit3 size={12} />
                  <span>Sửa Tỷ Lệ</span>
                </button>
              </div>

              {/* Financial values */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  background: 'var(--bg-app)',
                  padding: 8,
                  borderRadius: 8,
                  marginTop: 10,
                  fontSize: 12
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Thu</div>
                  <strong style={{ fontSize: 12.5 }}>{formatMoney(day.revenue)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Chi</div>
                  <strong style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{formatMoney(day.cost)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Lợi nhuận</div>
                  <strong style={{ fontSize: 13, color: day.profit >= 0 ? 'var(--status-completed-text)' : '#e11d48' }}>
                    {formatMoney(day.profit)}
                  </strong>
                </div>
              </div>

              {/* Split list */}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border-light)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Phân chia lương ({day.isCustom ? 'Đã tùy biến' : 'Mặc định'}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {day.allocations
                    .filter(a => a.isParticipating)
                    .map(a => (
                      <div key={a.userId} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <strong>{a.userName}</strong> ({a.percentage}%)
                        </span>
                        <strong style={{ color: 'var(--primary)' }}>
                          {formatMoney(a.salary)}
                        </strong>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Salary Config Modal */}
      {configModalOpen && (
        <SalaryConfigModal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          onSaved={fetchSalaryOverview}
          showToast={showToast}
        />
      )}

      {/* Daily Allocation Modal */}
      {selectedDayData && (
        <DailyAllocationModal
          isOpen={!!selectedDayData}
          dayData={selectedDayData}
          onClose={() => setSelectedDayData(null)}
          onSaved={fetchSalaryOverview}
          showToast={showToast}
        />
      )}
    </div>
  );
}

/**
 * pages/Timeline.jsx - Tiến độ cắm hoa theo ngày và khung giờ
 */
import { useState, useMemo } from 'react';
import {
  Flame, Calendar, Clock, Flower2, FileText, Truck, Store,
  Camera, Images, Maximize2, MessageSquare, Phone, Filter, Package
} from 'lucide-react';
import DatePicker from '../components/UI/DatePicker';
import { formatMoney, getStatusInfo } from '../utils/format';

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

function groupByDate(orders) {
  const map = {};
  orders
    .filter(o => o.status !== 'cancelled')
    .forEach(o => {
      const date = o.deliveryDate || 'Chưa xác định';
      if (!map[date]) map[date] = [];
      map[date].push(o);
    });

  // Sort dates
  return Object.entries(map).sort(([a], [b]) => {
    const parseDate = (d) => {
      const [day, month, year] = d.split('/').map(Number);
      return new Date(year, month - 1, day);
    };
    try { return parseDate(a) - parseDate(b); } catch { return 0; }
  });
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
  const [customDate, setCustomDate] = useState('');

  const isPeakDay = (date) => date?.includes('20/10');

  const nonCancelledOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'cancelled');
  }, [orders]);

  // Compute counts for filter pills (both orders and bouquets)
  const counts = useMemo(() => {
    let todayOrders = 0;
    let todayBouquets = 0;
    let tomorrowOrders = 0;
    let tomorrowBouquets = 0;
    let defaultOrders = 0;
    let defaultBouquets = 0;
    let oct20Orders = 0;
    let oct20Bouquets = 0;
    let allBouquets = 0;

    nonCancelledOrders.forEach(o => {
      const d = o.deliveryDate?.trim();
      const qty = parseInt(o.quantity, 10) || 1;
      allBouquets += qty;

      if (d === todayStr) {
        todayOrders++;
        todayBouquets += qty;
      }
      if (d === tomorrowStr) {
        tomorrowOrders++;
        tomorrowBouquets += qty;
      }
      if (d === todayStr || d === tomorrowStr) {
        defaultOrders++;
        defaultBouquets += qty;
      }
      if (d?.includes('20/10')) {
        oct20Orders++;
        oct20Bouquets += qty;
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
      all: nonCancelledOrders.length,
      allBouquets
    };
  }, [nonCancelledOrders, todayStr, tomorrowStr]);

  // Filter orders according to active filterMode
  const filteredOrders = useMemo(() => {
    return nonCancelledOrders.filter(o => {
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
        return customDate ? d === customDate : true;
      }
      if (filterMode === 'all') {
        return true;
      }
      return true;
    });
  }, [nonCancelledOrders, filterMode, customDate, todayStr, tomorrowStr]);

  const grouped = useMemo(() => groupByDate(filteredOrders), [filteredOrders]);

  const handleStatusChange = async (id, newStatus) => {
    if (window.confirm('Xác nhận đổi trạng thái đơn này?')) {
      if (onUpdateStatus) {
        await onUpdateStatus(id, newStatus);
      }
    }
  };

  return (
    <section className="view-section active" id="timelineView">
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
          Sắp xếp các đơn hoa theo <strong>Ngày giao</strong> và <strong>Khung giờ hẹn lấy</strong> giúp thợ hoa chủ động cắm theo thứ tự, hoa luôn tươi mới nhất khi khách nhận.
        </p>
      </div>

      {/* Date Filter Bar */}
      <div className="timeline-filter-bar">
        <div className="timeline-filter-pills">
          <button
            type="button"
            className={`timeline-pill ${filterMode === 'default' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('default');
              setCustomDate('');
            }}
            title="Mặc định: Chỉ xem lịch cắm hoa Hôm nay và Ngày mai"
          >
            <Calendar size={14} />
            <span>Hôm nay &amp; Ngày mai</span>
            <span className="pill-count">{counts.default} đơn · {counts.defaultBouquets} bó</span>
          </button>

          <button
            type="button"
            className={`timeline-pill ${filterMode === 'today' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('today');
              setCustomDate('');
            }}
          >
            <span>Hôm nay ({todayStr.slice(0, 5)})</span>
            <span className="pill-count">{counts.today} đơn · {counts.todayBouquets} bó</span>
          </button>

          <button
            type="button"
            className={`timeline-pill ${filterMode === 'tomorrow' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('tomorrow');
              setCustomDate('');
            }}
          >
            <span>Ngày mai ({tomorrowStr.slice(0, 5)})</span>
            <span className="pill-count">{counts.tomorrow} đơn · {counts.tomorrowBouquets} bó</span>
          </button>

          <button
            type="button"
            className={`timeline-pill ${filterMode === 'oct20' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('oct20');
              setCustomDate('');
            }}
            style={{ color: filterMode === 'oct20' ? '#ffffff' : '#b45309' }}
          >
            <Flame size={14} color={filterMode === 'oct20' ? '#ffffff' : '#f97316'} />
            <span>Đợt 20/10</span>
            <span className="pill-count">{counts.oct20} đơn · {counts.oct20Bouquets} bó</span>
          </button>

          <button
            type="button"
            className={`timeline-pill ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('all');
              setCustomDate('');
            }}
          >
            <span>Tất cả ngày</span>
            <span className="pill-count">{counts.all} đơn · {counts.allBouquets} bó</span>
          </button>
        </div>

        {/* DatePicker to pick any specific date */}
        <div className="timeline-date-control">
          <DatePicker
            value={customDate}
            onChange={(dmy) => {
              setCustomDate(dmy);
              setFilterMode(dmy ? 'custom' : 'default');
            }}
            onClear={() => {
              setCustomDate('');
              setFilterMode('default');
            }}
            placeholder="Xem ngày khác..."
            style={{ minWidth: 155 }}
          />
        </div>
      </div>

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
              {filterMode === 'default'
                ? `Không có đơn hoa nào hẹn lấy trong Hôm nay (${todayStr}) và Ngày mai (${tomorrowStr})`
                : filterMode === 'custom'
                ? `Không có đơn hoa nào hẹn giao vào ngày ${customDate}`
                : 'Không có đơn hàng nào phù hợp với bộ lọc'}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Bạn có thể chọn xem đợt cao điểm 20/10 hoặc xem tất cả các ngày khác trong hệ thống.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setFilterMode('all');
                  setCustomDate('');
                }}
              >
                Xem tất cả các ngày ({counts.all} đơn)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFilterMode('oct20');
                  setCustomDate('');
                }}
              >
                <Flame size={13} color="#f97316" />
                <span>Xem đợt 20/10 ({counts.oct20} đơn)</span>
              </button>
            </div>
          </div>
        )}

        {grouped.map(([date, dateOrders]) => {
          const sorted = sortByTime(dateOrders);
          const peak = isPeakDay(date);

          return (
            <div key={date} className="timeline-day-group" style={{ marginBottom: 28 }}>
              {/* Date Header */}
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
                      {dateOrders.length} đơn hàng · {formatMoney(dateOrders.reduce((s, o) => s + o.totalAmount, 0))}
                    </div>
                  </div>
                </div>

                {/* Prominent Daily Bouquet Summary Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--bg-surface)',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--primary)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <Package size={15} color="var(--primary)" />
                    <span>Tổng ngày: <strong style={{ fontSize: 14, color: peak ? '#b45309' : 'var(--primary)' }}>{dateOrders.reduce((s, ord) => s + (parseInt(ord.quantity, 10) || 1), 0)} bó hoa</strong></span>
                  </span>
                </div>
              </div>

              {/* Orders for this date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map((o, orderIndex) => {
                  const { className: statusClass } = getStatusInfo(o.status);
                  const hasImages = o.images && o.images.length > 0;
                  const qty = parseInt(o.quantity, 10) || 1;
                  return (
                    <div key={o.id} className="timeline-order-card" style={{
                      display: 'flex', flexWrap: 'wrap', gap: 12, padding: '14px 16px',
                      background: 'var(--bg-surface)', borderRadius: 12,
                      border: '1px solid var(--border-color)',
                      opacity: o.status === 'completed' ? 0.75 : 1,
                      alignItems: 'flex-start',
                    }}>
                      {/* Time Column */}
                      <div style={{ minWidth: 64, textAlign: 'center', padding: '6px 8px', background: 'var(--bg-app)', borderRadius: 8, flexShrink: 0 }}>
                        {o.deliveryTime ? (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{o.deliveryTime}</div>
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
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
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
                            onChange={e => handleStatusChange(o.id, e.target.value)}
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
                          <span>{o.customerName}</span>
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
                        </div>

                        {/* Flower Product Name & Quantity */}
                        <div style={{ fontSize: 13.5, color: 'var(--text-main)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, flexWrap: 'wrap' }}>
                          <Flower2 size={14} color="var(--primary)" />
                          <span style={{ fontWeight: 700 }}>{o.productName}</span>
                          <span
                            className={`timeline-qty-badge ${qty > 1 ? 'multiple' : 'single'}`}
                          >
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
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{formatMoney(o.totalAmount)}</div>
                        {o.remainingAmount > 0 && (
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
    </section>
  );
}

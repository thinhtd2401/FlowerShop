/**
 * pages/Timeline.jsx - Tiến độ cắm hoa theo ngày và khung giờ
 */
import { useMemo } from 'react';
import { Flame, Calendar, Clock, Flower2, FileText, Truck, Store } from 'lucide-react';
import { formatMoney, getStatusInfo } from '../utils/format';

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

export default function Timeline({ orders }) {
  const grouped = useMemo(() => groupByDate(orders), [orders]);

  const isPeakDay = (date) => date?.includes('20/10');

  return (
    <section className="view-section active" id="timelineView">
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
          Sắp xếp các đơn hoa theo <strong>Ngày giao</strong> và <strong>Khung giờ hẹn lấy</strong> giúp thợ hoa chủ động cắm theo thứ tự, hoa luôn tươi mới nhất khi khách nhận.
        </p>
      </div>

      <div id="timelineContainer">
        {grouped.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', background: '#fff', borderRadius: 12 }}>
            Không có đơn hàng nào để hiển thị
          </div>
        )}

        {grouped.map(([date, dateOrders]) => {
          const sorted = sortByTime(dateOrders);
          const peak = isPeakDay(date);

          return (
            <div key={date} className="timeline-day-group" style={{ marginBottom: 28 }}>
              {/* Date Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                padding: '10px 16px',
                background: peak ? 'linear-gradient(135deg, #fef9c3, #fde68a)' : 'var(--bg-muted)',
                borderRadius: 10, borderLeft: `4px solid ${peak ? '#f59e0b' : 'var(--primary)'}`,
              }}>
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
                    {dateOrders.length} đơn · {formatMoney(dateOrders.reduce((s, o) => s + o.totalAmount, 0))}
                  </div>
                </div>
              </div>

              {/* Orders for this date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map(o => {
                  const { label: statusLabel, className: statusClass } = getStatusInfo(o.status);
                  return (
                    <div key={o.id} style={{
                      display: 'flex', flexWrap: 'wrap', gap: 12, padding: '14px 16px',
                      background: 'var(--bg-surface)', borderRadius: 12,
                      border: '1px solid var(--border-color)',
                      opacity: o.status === 'completed' ? 0.75 : 1,
                      alignItems: 'center',
                    }}>
                      {/* Time Column */}
                      <div style={{ minWidth: 64, textAlign: 'center', padding: '6px 8px', background: 'var(--bg-app)', borderRadius: 8 }}>
                        {o.deliveryTime ? (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{o.deliveryTime}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>giờ hẹn</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div style={{ flex: '1 1 200px', minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{o.id}</span>
                          <span className={`status-badge ${statusClass}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                            {statusLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          {o.customerName}
                          {o.phone && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>{o.phone}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Flower2 size={13} color="var(--primary)" />
                          <span>{o.productName} {o.quantity > 1 && `x${o.quantity}`}</span>
                        </div>
                        {o.notes && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                            <FileText size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{o.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Money & Delivery Column */}
                      <div style={{ textAlign: 'right', marginLeft: 'auto', minWidth: 100 }}>
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

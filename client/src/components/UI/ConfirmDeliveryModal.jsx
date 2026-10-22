/**
 * components/UI/ConfirmDeliveryModal.jsx
 * Hộp thoại xác nhận đã nhận đủ tiền khách hàng trước khi chuyển trạng thái sang "Đã Giao".
 * Tuân thủ AGENTS.md: Lucide-react only, không emoji, touch-friendly, không zoom trên mobile.
 */
import { useEffect } from 'react';
import { CheckCircle2, DollarSign, X, AlertCircle, Package } from 'lucide-react';
import { formatMoney } from '../../utils/format';

export default function ConfirmDeliveryModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  isUpdating = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isUpdating) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUpdating, onClose]);

  if (!isOpen || !order) return null;

  const totalAmount = parseInt(order.totalAmount, 10) || 0;
  const depositAmount = parseInt(order.depositAmount, 10) || 0;
  const remainingAmount = Math.max(0, totalAmount - depositAmount);
  const isFullyPaid = remainingAmount === 0;

  return (
    <div
      className="modal-overlay active"
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUpdating) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'var(--bg-surface)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={22} color="#10b981" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                Xác Nhận Đã Nhận Đủ Tiền
              </h4>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Chuyển trạng thái sang "Đã Giao"
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isUpdating}
            title="Đóng"
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', background: 'var(--bg-surface)' }}>
          {/* Order Info Card */}
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
                {order.id}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                {order.customerName}
              </span>
            </div>

            {order.productName && (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                <Package size={13} color="var(--primary)" />
                <span>{order.productName} {order.quantity ? `(SL: ${order.quantity})` : ''}</span>
              </div>
            )}

            {/* Financial Breakdown */}
            <div style={{
              borderTop: '1px dashed var(--border-color)',
              paddingTop: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 13
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Tổng giá trị đơn:</span>
                <strong style={{ color: 'var(--text-main)' }}>{formatMoney(totalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Đã cọc trước:</span>
                <span>{formatMoney(depositAmount)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 4,
                borderTop: '1px solid var(--border-light)'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Còn lại cần thu:</span>
                <strong style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: isFullyPaid ? '#10b981' : '#e11d48'
                }}>
                  {isFullyPaid ? 'Đã thanh toán đủ (0 đ)' : formatMoney(remainingAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Prompt Message */}
          <div style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            padding: '10px 12px',
            background: isFullyPaid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${isFullyPaid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            borderRadius: 10,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--text-main)'
          }}>
            {isFullyPaid ? (
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
            )}
            <div>
              {isFullyPaid ? (
                <div>Đơn hàng đã được thanh toán đủ 100%. Bạn có muốn chuyển sang trạng thái <strong>Đã Giao</strong>?</div>
              ) : (
                <div>
                  Khách hàng vẫn còn nợ <strong>{formatMoney(remainingAmount)}</strong>.
                  <br />
                  Bạn đã nhận được đủ số tiền này trước khi hoàn tất giao hoa chưa?
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          padding: '14px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-muted)'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isUpdating}
            style={{ minWidth: 100 }}
          >
            Chưa thu / Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isUpdating}
            style={{
              background: '#10b981',
              borderColor: '#10b981',
              color: '#ffffff',
              minWidth: 140,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{isUpdating ? 'Đang cập nhật...' : 'Đã Nhận Đủ Tiền'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

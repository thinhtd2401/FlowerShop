/**
 * components/UI/ConfirmDeleteModal.jsx
 * Hộp thoại xác nhận xóa nội bộ thay thế window.confirm,
 * chống bị chặn popup trên mobile, tablet và trình duyệt.
 */
import { useEffect } from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác Nhận Xóa',
  itemName = '',
  message = 'Hành động này sẽ xóa vĩnh viễn dữ liệu khỏi hệ thống và không thể hoàn tác.',
  confirmText = 'Xác Nhận Xóa',
  cancelText = 'Giữ Lại',
  isDeleting = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 420,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
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
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertCircle size={20} color="#ef4444" />
            </div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              {title}
            </h4>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            title="Đóng"
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', background: 'var(--bg-surface)' }}>
          {itemName && (
            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 12,
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Trash2 size={15} color="#ef4444" />
              <span>{itemName}</span>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {message}
          </p>
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
            disabled={isDeleting}
            style={{ minWidth: 90 }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              borderColor: '#ef4444',
              minWidth: 120,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)'
            }}
          >
            <Trash2 size={14} />
            <span>{isDeleting ? 'Đang xóa...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

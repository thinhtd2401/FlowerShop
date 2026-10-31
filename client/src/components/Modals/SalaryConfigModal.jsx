/**
 * components/Modals/SalaryConfigModal.jsx
 * Cài đặt danh sách nhân sự tham gia tính lương (Admin & Quản lý)
 * Tuân thủ quy tắc: Lucide icons only (no emoji), responsive mobile/desktop, no-zoom inputs
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  CheckCircle2,
  Save,
  Shield,
  ShieldCheck,
  User,
  Info,
  Loader2
} from 'lucide-react';
import { salaryApi } from '../../api';

export default function SalaryConfigModal({ isOpen, onClose, onSaved, showToast }) {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await salaryApi.getConfig();
        setUsers(data || []);
        const eligible = new Set(
          (data || []).filter(u => u.isSalaryEligible).map(u => u.id)
        );
        setSelectedIds(eligible);
      } catch (err) {
        showToast?.(err.response?.data?.error || 'Lỗi tải danh sách nhân sự', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [isOpen, showToast]);

  if (!isOpen) return null;

  const handleToggleUser = (userId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(users.map(u => u.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await salaryApi.updateConfig({ eligibleUserIds: Array.from(selectedIds) });
      showToast?.('Đã cập nhật danh sách nhân sự tham gia tính lương', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      showToast?.(err.response?.data?.error || 'Lỗi lưu cấu hình', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal-content salary-config-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="modal-icon-badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Cài Đặt Nhân Sự Tính Lương
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Chọn những ai (cả admin và nhân viên) sẽ tham gia nhận lương theo lợi nhuận
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '16px 20px' }}>
          {/* Info note */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              marginBottom: 16,
              fontSize: 12.5,
              color: 'var(--text-main)',
              lineHeight: 1.5
            }}
          >
            <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              Hệ thống sẽ <strong>chia đều lợi nhuận mỗi ngày</strong> cho những người được chọn bên dưới.
              Những ngày có người vắng hoặc tỷ lệ khác nhau, bạn có thể chỉnh riêng theo từng ngày.
            </div>
          </div>

          {/* Quick select buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
              Đã chọn: <strong style={{ color: 'var(--primary)' }}>{selectedIds.size}</strong> / {users.length} người
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSelectAll}
                style={{ fontSize: 11.5, padding: '4px 10px' }}
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDeselectAll}
                style={{ fontSize: 11.5, padding: '4px 10px' }}
              >
                Bỏ chọn hết
              </button>
            </div>
          </div>

          {/* User Checklist */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
              <Loader2 className="animate-spin" size={24} color="var(--primary)" />
            </div>
          ) : (
            <div className="salary-user-checklist" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {users.map(u => {
                const isChecked = selectedIds.has(u.id);
                return (
                  <label
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: isChecked ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isChecked ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleUser(u.id)}
                        style={{
                          width: 18,
                          height: 18,
                          accentColor: 'var(--primary)',
                          cursor: 'pointer'
                        }}
                      />
                      <div className="user-avatar-tiny" style={{ width: 34, height: 34, fontSize: 14 }}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} />
                        ) : (
                          <span>{u.name?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`role-badge role-${u.role}`}
                        style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12 }}
                      >
                        {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '14px 20px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Lưu Danh Sách ({selectedIds.size})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


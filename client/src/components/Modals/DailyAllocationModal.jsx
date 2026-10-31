/**
 * components/Modals/DailyAllocationModal.jsx
 * Điều chỉnh tỷ lệ chia lương theo từng ngày (Admin & Quản lý)
 * Tuân thủ quy tắc: Lucide icons only (no emoji), responsive mobile/desktop, no-zoom inputs
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Percent,
  DollarSign,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Info,
  Loader2
} from 'lucide-react';
import { salaryApi } from '../../api';
import { formatMoney } from '../../utils/format';

export default function DailyAllocationModal({ isOpen, dayData, onClose, onSaved, showToast }) {
  const [allocations, setAllocations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!isOpen || !dayData) return;
    // Sao chép deep mảng allocations từ dayData
    const initial = (dayData.allocations || []).map(a => ({
      ...a,
      isParticipating: Boolean(a.isParticipating),
      percentage: Number(a.percentage) || 0,
      notes: a.notes || ''
    }));
    setAllocations(initial);
  }, [isOpen, dayData]);

  if (!isOpen || !dayData) return null;

  const totalPercentage = useMemo(() => {
    return allocations.reduce((sum, a) => {
      if (!a.isParticipating) return sum;
      return sum + (parseFloat(a.percentage) || 0);
    }, 0);
  }, [allocations]);

  const isValid100 = Math.abs(totalPercentage - 100) < 0.05;

  const handleToggleParticipating = (index) => {
    setAllocations(prev => {
      const next = [...prev];
      const target = next[index];
      const nextParticipating = !target.isParticipating;
      target.isParticipating = nextParticipating;
      if (!nextParticipating) {
        target.percentage = 0;
      }
      return next;
    });
  };

  const handlePercentageChange = (index, val) => {
    const num = Math.max(0, Math.min(100, parseFloat(val) || 0));
    setAllocations(prev => {
      const next = [...prev];
      next[index].percentage = num;
      return next;
    });
  };

  const handleNotesChange = (index, val) => {
    setAllocations(prev => {
      const next = [...prev];
      next[index].notes = val;
      return next;
    });
  };

  // Nút nhanh: Tự động chia đều 100% cho những người đang được đánh dấu tham gia
  const handleAutoEqualize = () => {
    const participatingIndexes = [];
    allocations.forEach((a, idx) => {
      if (a.isParticipating) participatingIndexes.push(idx);
    });

    if (participatingIndexes.length === 0) {
      showToast?.('Vui lòng tích chọn ít nhất 1 người tham gia', 'error');
      return;
    }

    const equalShare = Number((100 / participatingIndexes.length).toFixed(2));
    setAllocations(prev => {
      return prev.map((a, idx) => {
        if (!a.isParticipating) return { ...a, percentage: 0 };
        return { ...a, percentage: equalShare };
      });
    });
    showToast?.(`Đã chia đều ${equalShare}% cho ${participatingIndexes.length} người tham gia`, 'success');
  };

  // Lưu cấu hình tùy chỉnh
  const handleSave = async () => {
    try {
      setSaving(true);
      await salaryApi.saveDailyAllocation({
        date: dayData.date,
        allocations: allocations.map(a => ({
          userId: a.userId,
          percentage: a.isParticipating ? (parseFloat(a.percentage) || 0) : 0,
          isParticipating: a.isParticipating ? 1 : 0,
          notes: (a.notes || '').trim()
        }))
      });

      showToast?.(`Đã cập nhật tỷ lệ tính lương ngày ${dayData.date}`, 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      showToast?.(err.response?.data?.error || 'Lỗi lưu tỷ lệ ngày', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Khôi phục về chia đều mặc định của hệ thống
  const handleResetToDefault = async () => {
    if (!window.confirm(`Khôi phục ngày ${dayData.date} về tỷ lệ chia đều mặc định?`)) return;
    try {
      setResetting(true);
      await salaryApi.resetDailyAllocation(dayData.date);
      showToast?.(`Đã khôi phục chia đều mặc định cho ngày ${dayData.date}`, 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      showToast?.(err.response?.data?.error || 'Lỗi khôi phục chia đều', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal-content daily-allocation-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 680 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="modal-icon-badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Điều Chỉnh Tỷ Lệ Lương — {dayData.date}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Tùy chỉnh tỷ lệ phần trăm theo sự tham gia thực tế của từng người trong ngày
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '16px 20px' }}>
          {/* Day Financial Summary Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 10,
              background: 'var(--bg-app)',
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              marginBottom: 16
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShoppingBag size={11} /> Đơn Hàng
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                {dayData.orderCount} đơn
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={11} /> Doanh Thu
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                {formatMoney(dayData.revenue)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Wallet size={11} /> Chi Phí
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)', marginTop: 2 }}>
                {formatMoney(dayData.cost)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <DollarSign size={11} /> Lợi Nhuận
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: dayData.profit >= 0 ? 'var(--status-completed-text)' : '#e11d48',
                  marginTop: 2
                }}
              >
                {formatMoney(dayData.profit)}
              </div>
            </div>
          </div>

          {/* Allocation Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Phân Bổ Tỷ Lệ:</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAutoEqualize}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, padding: '4px 10px' }}
                title="Tự động chia đều 100% cho những người tham gia"
              >
                <Percent size={12} />
                <span>Chia đều 100%</span>
              </button>
            </div>

            {/* Total Percentage Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12.5,
                fontWeight: 700,
                color: isValid100 ? 'var(--status-completed-text)' : '#d97706',
                background: isValid100 ? 'var(--status-completed-bg)' : 'var(--status-pending-bg)',
                padding: '3px 10px',
                borderRadius: 12,
                border: `1px solid ${isValid100 ? 'var(--status-completed-border)' : 'var(--status-pending-border)'}`
              }}
            >
              {isValid100 ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>Tổng: {totalPercentage.toFixed(1)}%</span>
            </div>
          </div>

          {/* Allocation List */}
          <div className="daily-allocation-list" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
            {allocations.map((a, idx) => {
              const estimatedSalary = a.isParticipating
                ? Math.round(dayData.profit * ((parseFloat(a.percentage) || 0) / 100))
                : 0;

              return (
                <div
                  key={a.userId}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: a.isParticipating ? '1.5px solid var(--border-color)' : '1px dashed var(--border-color)',
                    background: a.isParticipating ? 'var(--bg-surface)' : 'var(--bg-app)',
                    opacity: a.isParticipating ? 1 : 0.65,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {/* User info & checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={a.isParticipating}
                        onChange={() => handleToggleParticipating(idx)}
                        style={{ width: 17, height: 17, accentColor: 'var(--primary)' }}
                      />
                      <div className="user-avatar-tiny" style={{ width: 30, height: 30, fontSize: 13 }}>
                        {a.avatar ? (
                          <img src={a.avatar} alt={a.userName} />
                        ) : (
                          <span>{a.userName?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-main)' }}>
                          {a.userName}
                        </div>
                        <span
                          className={`role-badge role-${a.role}`}
                          style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8 }}
                        >
                          {a.role === 'admin' ? 'Admin' : a.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                        </span>
                      </div>
                    </label>

                    {/* Percentage input & Estimated salary */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          disabled={!a.isParticipating}
                          value={a.isParticipating ? a.percentage : 0}
                          onChange={e => handlePercentageChange(idx, e.target.value)}
                          style={{
                            width: 65,
                            padding: '5px 8px',
                            textAlign: 'right',
                            fontWeight: 700,
                            borderRadius: 6,
                            border: '1px solid var(--border-color)',
                            background: a.isParticipating ? 'var(--bg-elevated)' : 'var(--bg-app)',
                            fontSize: 14
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                      </div>

                      <div style={{ minWidth: 100, textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tiền nhận</div>
                        <strong
                          style={{
                            fontSize: 13.5,
                            color: estimatedSalary >= 0 ? 'var(--status-completed-text)' : '#e11d48'
                          }}
                        >
                          {a.isParticipating ? formatMoney(estimatedSalary) : '0 đ'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Notes input */}
                  {a.isParticipating && (
                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed var(--border-light)' }}>
                      <input
                        type="text"
                        placeholder="Ghi chú (VD: Làm ca sáng, Nghỉ nửa buổi...)"
                        value={a.notes}
                        onChange={e => handleNotesChange(idx, e.target.value)}
                        style={{
                          width: '100%',
                          fontSize: 12,
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--border-light)',
                          background: 'var(--bg-app)'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {dayData.isCustom && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetToDefault}
                disabled={resetting || saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#e11d48', borderColor: '#fecaca' }}
                title="Xóa tùy chỉnh này và quay về chia đều mặc định"
              >
                {resetting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RotateCcw size={13} />
                )}
                <span>Khôi phục chia đều</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving || resetting}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || resetting}
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
                  <span>Lưu Tỷ Lệ Ngày</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


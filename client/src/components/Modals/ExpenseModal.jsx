/**
 * components/Modals/ExpenseModal.jsx - Quản lý thêm & chỉnh sửa chi phí vốn
 */
import { useState, useEffect } from 'react';
import { Wallet, X, Calendar, Sparkles } from 'lucide-react';
import { formatMoney, formatToDDMMYYYY } from '../../utils/format';
import DatePicker from '../UI/DatePicker';

const EXPENSE_PRESETS = {
  'Hoa tươi': [
    { name: 'Hoa hồng Đà Lạt', price: 250000 },
    { name: 'Cúc Tana', price: 180000 },
    { name: 'Hoa Baby trắng', price: 200000 },
    { name: 'Hoa Ly kép', price: 280000 },
    { name: 'Hoa đêm chợ đầu mối', price: 850000 },
  ],
  'Phụ liệu & Bao bì': [
    { name: 'Giấy gói Hàn Quốc', price: 120000 },
    { name: 'Xốp cắm Oasis thùng', price: 350000 },
    { name: 'Ruy băng / Nơ lụa', price: 85000 },
    { name: 'Túi đựng bó hoa', price: 150000 },
  ],
  'Vận hành': [
    { name: 'Cơm trưa / Ăn đêm ca trực lễ', price: 120000 },
    { name: 'Nước uống thợ cắm hoa', price: 50000 },
    { name: 'Book ship / Grab lấy phụ liệu gấp', price: 75000 },
  ],
  'Khác': [
    { name: 'Đèn led trang trí bó hoa', price: 50000 },
    { name: 'Bộ thiệp chúc mừng mini', price: 60000 },
  ]
};

const DEFAULT_FORM = {
  category: 'Hoa tươi',
  itemName: '',
  quantity: 1,
  unitPrice: '',
  date: ''
};

export default function ExpenseModal({ isOpen, expense, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const isEditing = !!expense;

  useEffect(() => {
    if (expense) {
      setForm({ ...DEFAULT_FORM, ...expense });
    } else {
      const today = formatToDDMMYYYY(new Date());
      setForm({ ...DEFAULT_FORM, date: today });
    }
  }, [expense, isOpen]);

  // Khóa cuộn nền khi mở modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const quantity = Math.max(1, parseInt(form.quantity) || 1);
  const unitPrice = Math.max(0, parseInt(form.unitPrice) || 0);
  const totalCost = quantity * unitPrice;

  const currentPresets = EXPENSE_PRESETS[form.category] || [];

  const setQuickDate = (type) => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    set('date', formatToDDMMYYYY(d));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.itemName.trim()) {
      alert('Vui lòng nhập tên mặt hàng hoặc nội dung chi phí!');
      return;
    }
    await onSave({
      ...form,
      quantity,
      unitPrice,
      totalCost,
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" id="expenseModal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={20} color="var(--primary)" />
            <span>{isEditing ? `Chỉnh Sửa Khoản Chi (${expense?.id})` : 'Thêm Khoản Chi Phí Vốn'}</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose} title="Đóng" type="button">
            <X size={18} />
          </button>
        </div>

        <form id="expenseForm" onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Category selection */}
            <div className="form-group">
              <label>Phân Loại Chi Phí *</label>
              <select id="expenseCategory" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="Hoa tươi">Hoa tươi (Chợ đêm, Chợ đầu mối, Nhà vườn)</option>
                <option value="Phụ liệu & Bao bì">Phụ liệu (Giấy gói, Xốp cắm, Nơ, Cốt, Túi, Kéo)</option>
                <option value="Vận hành">Chi phí ăn uống &amp; Vận hành dịp lễ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {/* Item Name & Quick suggestions */}
            <div className="form-group">
              <label>Tên Mặt Hàng / Chi Tiết Chi *</label>
              <input
                type="text"
                id="expenseItemName"
                required
                placeholder="VD: Hoa hồng Đà Lạt, Giấy gói xốp..."
                value={form.itemName}
                onChange={e => set('itemName', e.target.value)}
              />
              {currentPresets.length > 0 && (
                <div className="preset-pills" style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Sparkles size={11} /> Gợi ý:
                  </span>
                  {currentPresets.map(p => (
                    <span
                      key={p.name}
                      className="preset-pill preset-flower"
                      onClick={() => {
                        set('itemName', p.name);
                        set('unitPrice', p.price);
                      }}
                    >
                      {p.name} ({(p.price / 1000).toFixed(0)}k)
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity and unit price */}
            <div className="form-row">
              <div className="form-group">
                <label>Số Lượng</label>
                <input
                  type="number"
                  id="expenseQty"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Đơn Giá (VNĐ) *</label>
                <input
                  type="number"
                  id="expenseUnitPrice"
                  min="0"
                  step="10000"
                  required
                  placeholder="VD: 250000"
                  value={form.unitPrice}
                  onChange={e => set('unitPrice', e.target.value)}
                />
              </div>
            </div>

            {/* Total Cost live preview */}
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '10px 14px',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Tổng Tiền Chi Vốn:</span>
              <strong style={{ fontSize: 16, color: '#b45309' }}>{formatMoney(totalCost)}</strong>
            </div>

            {/* Expense Date & Quick shortcuts */}
            <div className="form-group">
              <label>Ngày Chi (dd/mm/yyyy)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <DatePicker
                  id="expenseDate"
                  value={form.date}
                  onChange={(dmy) => set('date', dmy)}
                  placeholder="dd/mm/yyyy"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setQuickDate('today')}
                  title="Chọn hôm nay"
                >
                  <Calendar size={13} />
                  <span>Hôm nay</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setQuickDate('yesterday')}
                  title="Chọn hôm qua"
                >
                  <span>Hôm qua</span>
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Lưu Thay Đổi' : 'Thêm Khoản Chi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

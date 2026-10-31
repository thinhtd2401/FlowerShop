/**
 * components/Modals/OrderModal.jsx - Tạo & Quản lý đơn hàng hoa hoàn chỉnh
 */
import { useState, useEffect, useRef } from 'react';
import {
  Flower2, X, Sparkles, Clock, Truck, Store, Printer, CreditCard,
  MessageSquare, MapPin, UserCheck, Calendar, Flame, Camera, Upload,
  Trash2, Loader2, Image as ImageIcon, RotateCcw
} from 'lucide-react';
import { formatMoney } from '../../utils/format';
import DatePicker from '../UI/DatePicker';
import InAppCameraModal from '../UI/InAppCameraModal';
import ConfirmDeleteModal from '../UI/ConfirmDeleteModal';
import ConfirmDeliveryModal from '../UI/ConfirmDeliveryModal';
import { uploadApi, usersApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { compressImage, compressImages } from '../../utils/imageCompressor';
import {
  saveOrderDraft,
  getOrderDraft,
  clearOrderDraft,
  hasSubstantialData
} from '../../utils/orderDraft';

const FLOWER_PRESETS = [
  { name: 'Mix nhạt tone pastel', price: 250000 },
  { name: 'Sophia mix sao xanh', price: 300000 },
  { name: 'Bó hồng đỏ Đà Lạt', price: 220000 },
  { name: 'Ly kép mix baby', price: 280000 },
  { name: 'Plume mix hoa tươi', price: 280000 },
  { name: 'Giỏ hoa để bàn chúc mừng', price: 450000 },
  { name: 'Lẵng hoa khai trương', price: 650000 },
];

// 35 khung giờ cách nhau 30 phút từ 06:00 đến 23:00
const FULL_TIME_SLOTS = [];
for (let h = 6; h <= 23; h++) {
  const hh = String(h).padStart(2, '0');
  FULL_TIME_SLOTS.push(`${hh}:00`);
  if (h < 23) {
    FULL_TIME_SLOTS.push(`${hh}:30`);
  }
}

// Helpers chuyển đổi định dạng DD/MM/YYYY <-> YYYY-MM-DD cho input[type="date"]
function toDateInputValue(ddmmyyyy) {
  if (!ddmmyyyy) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) return ddmmyyyy;
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

function fromDateInputValue(yyyymmdd) {
  if (!yyyymmdd) return '';
  const parts = yyyymmdd.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return yyyymmdd;
}

function getFriendlyDatePreview(ddmmyyyy) {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    if (!isNaN(dateObj.getTime())) {
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return `${days[dateObj.getDay()]}, ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return ddmmyyyy;
}

function getTodayFormatted() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const DEFAULT_FORM = {
  customerName: '',
  phone: '',
  channel: 'Thread',
  status: 'pending',
  productName: '',
  quantity: 1,
  unitPrice: 250000,
  depositAmount: 0,
  orderDate: getTodayFormatted(),
  deliveryDate: getTodayFormatted(),
  deliveryTime: '10:00',
  deliveryType: 'Khách qua lấy',
  deliveryAddress: '',
  recipientName: '',
  recipientPhone: '',
  cardMessage: '',
  notes: '',
  images: [],
  assignedUserId: '',
  assignedUserName: ''
};

export default function OrderModal({ isOpen, order, onClose, onSave, onDelete }) {
  const { user: currentUser } = useAuth();
  const [assignees, setAssignees] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (isOpen) {
      usersApi.getAssignees()
        .then(data => {
          if (Array.isArray(data)) setAssignees(data);
        })
        .catch(err => console.warn('Lỗi tải danh sách người tiếp nhận:', err));
    }
  }, [isOpen]);
  const [showPrintTag, setShowPrintTag] = useState(false);
  const [timeSession, setTimeSession] = useState('all');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showInAppCamera, setShowInAppCamera] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = !!order;

  const fileInputRef = useRef(null);

  const handleConfirmDelete = async () => {
    if (!order?.id || !onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(order.id);
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Lỗi khi xóa đơn hàng:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (order) {
      const resolvedChannel = order.channel === 'Threads' ? 'Thread' : (order.channel || 'Thread');
      setForm({
        ...DEFAULT_FORM,
        ...order,
        channel: resolvedChannel,
        assignedUserId: order.assignedUserId || '',
        assignedUserName: order.assignedUserName || '',
        images: order.images || []
      });
      setIsDraftRestored(false);
    } else if (isOpen) {
      const savedDraft = getOrderDraft();
      if (savedDraft && hasSubstantialData(savedDraft)) {
        setForm({
          ...DEFAULT_FORM,
          ...savedDraft,
          assignedUserId: savedDraft.assignedUserId || currentUser?.id || '',
          assignedUserName: savedDraft.assignedUserName || currentUser?.name || ''
        });
        setIsDraftRestored(true);
      } else {
        const today = getTodayFormatted();
        setForm({
          ...DEFAULT_FORM,
          orderDate: today,
          deliveryDate: today,
          assignedUserId: currentUser?.id || '',
          assignedUserName: currentUser?.name || '',
          images: []
        });
        setIsDraftRestored(false);
      }
    }
    setShowPrintTag(false);
  }, [order, isOpen, currentUser]);

  // Tự động lưu bản nháp theo thời gian thực khi người dùng nhập liệu (chỉ áp dụng khi tạo đơn mới)
  useEffect(() => {
    if (!order && isOpen && hasSubstantialData(form)) {
      const timer = setTimeout(() => {
        saveOrderDraft(form);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [form, order, isOpen]);

  const handleDiscardDraft = () => {
    clearOrderDraft();
    const today = getTodayFormatted();
    setForm({
      ...DEFAULT_FORM,
      orderDate: today,
      deliveryDate: today,
      assignedUserId: currentUser?.id || '',
      assignedUserName: currentUser?.name || '',
      images: []
    });
    setIsDraftRestored(false);
  };

  const handleDirectPhotoCaptured = async (capturedFile) => {
    if (!capturedFile) return;
    try {
      setIsUploadingImages(true);
      const compressed = await compressImage(capturedFile, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85
      });
      const formData = new FormData();
      formData.append('images', compressed);
      const res = await uploadApi.uploadImages(formData);
      if (res.success && res.urls && res.urls.length > 0) {
        setForm(prev => {
          const nextForm = {
            ...prev,
            images: [...(prev.images || []), ...res.urls]
          };
          if (!order) saveOrderDraft(nextForm);
          return nextForm;
        });
      }
    } catch (err) {
      console.error('Lỗi upload ảnh chụp trực tiếp:', err);
      alert('Tải ảnh thất bại: ' + (err.message || 'Lỗi tải ảnh'));
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleImageUpload = async (e) => {
    e.stopPropagation();
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsUploadingImages(true);
      const compressedFiles = await compressImages(files, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85
      });
      const formData = new FormData();
      compressedFiles.forEach(file => {
        formData.append('images', file);
      });
      const res = await uploadApi.uploadImages(formData);
      if (res.success && res.urls && res.urls.length > 0) {
        setForm(prev => {
          const nextForm = {
            ...prev,
            images: [...(prev.images || []), ...res.urls]
          };
          if (!order) saveOrderDraft(nextForm);
          return nextForm;
        });
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Tải ảnh thất bại: ' + (err.message || 'Lỗi tải ảnh'));
    } finally {
      setIsUploadingImages(false);
      try {
        if (e.target) e.target.value = '';
      } catch {}
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Khóa cuộn nền (background scroll lock) khi mở modal trên mobile & desktop
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

  // Bảo vệ chống reload ngoài ý muốn khi đang mở form tạo/sửa đơn
  useEffect(() => {
    if (!isOpen) return;
    const handleBeforeUnload = (e) => {
      if (hasSubstantialData(form)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, form]);

  const quantity = Math.max(1, parseInt(form.quantity) || 1);
  const unitPrice = Math.max(0, parseInt(form.unitPrice) || 0);
  const totalAmount = quantity * unitPrice;
  const depositAmount = Math.max(0, parseInt(form.depositAmount) || 0);
  const remainingAmount = Math.max(0, totalAmount - depositAmount);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // Quick Deposit Helpers
  const handleQuickDeposit = (type) => {
    if (type === 'zero') set('depositAmount', 0);
    else if (type === 'half') set('depositAmount', Math.round(totalAmount * 0.5));
    else if (type === 'full') set('depositAmount', totalAmount);
  };

  // Quick Date Helpers
  const handleQuickDate = (type) => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    if (type === 'today') {
      set('deliveryDate', `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`);
    } else if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      set('deliveryDate', `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`);
    } else if (type === 'oct20') {
      set('deliveryDate', '20/10/2026');
    }
  };

  const filteredTimeSlots = FULL_TIME_SLOTS.filter(t => {
    const hour = parseInt(t.split(':')[0], 10);
    if (timeSession === 'morning') return hour >= 6 && hour < 12;
    if (timeSession === 'afternoon') return hour >= 12 && hour < 18;
    if (timeSession === 'evening') return hour >= 18;
    return true;
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customerName.trim()) {
      alert('Vui lòng nhập tên khách hàng!');
      return;
    }
    if (!form.productName.trim()) {
      alert('Vui lòng nhập mẫu hoa hoặc sản phẩm!');
      return;
    }
    const isCompleted = form.status === 'completed';
    const finalDeposit = isCompleted ? totalAmount : depositAmount;
    const finalRemaining = isCompleted ? 0 : remainingAmount;

    await onSave({
      ...form,
      quantity,
      unitPrice,
      totalAmount,
      depositAmount: finalDeposit,
      remainingAmount: finalRemaining,
    });
    clearOrderDraft();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" id="orderModal">
      <div className="modal-content" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="modal-header">
          <h3 id="orderModalTitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flower2 size={20} color="var(--primary)" />
            <span>{isEditing ? `Chỉnh Sửa Đơn Hàng (${order?.id})` : 'Tạo Đơn Hàng Hoa Mới'}</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isEditing && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowPrintTag(!showPrintTag)}
                title="In Tag Hoa / Phiếu Giao"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Printer size={14} />
                <span>Tag Hoa</span>
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose} title="Đóng" type="button">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thông báo tự động khôi phục bản nháp khi bị reload / văng form */}
        {isDraftRestored && !isEditing && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 8,
            padding: '8px 14px',
            margin: '12px 16px 0',
            fontSize: 12.5,
            color: 'var(--primary)',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Sparkles size={14} />
              <span>Đã tự động khôi phục dữ liệu bạn vừa nhập dở trước đó!</span>
            </span>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                padding: '4px 8px',
                height: 'auto'
              }}
              title="Xóa nháp và tạo lại từ đầu"
            >
              <RotateCcw size={12} />
              <span>Xóa nháp</span>
            </button>
          </div>
        )}

        {/* Print Floral Tag Preview Sub-modal */}
        {showPrintTag && (
          <div style={{
            background: '#fafaf9',
            border: '2px dashed var(--primary)',
            borderRadius: 10,
            padding: 16,
            margin: '12px 16px',
            fontSize: 13,
            lineHeight: 1.6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e7e5e4', paddingBottom: 6, marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: 15, fontWeight: 700 }}>
                <Flower2 size={16} /> KHflower Shop — Tag Giao Hoa
              </span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Mã: {order?.id}</span>
            </div>
            <div><strong>Khách đặt:</strong> {form.customerName} {form.phone && `(${form.phone})`}</div>
            <div><strong>Mẫu hoa:</strong> {form.productName} (SL: {quantity})</div>
            <div><strong>Hẹn nhận:</strong> {form.deliveryTime} · {form.deliveryDate} ({form.deliveryType})</div>
            {form.deliveryType === 'Giao hàng / Book ship' && (
              <>
                <div><strong>Người nhận:</strong> {form.recipientName || form.customerName} {form.recipientPhone && `(${form.recipientPhone})`}</div>
                <div><strong>Địa chỉ giao:</strong> {form.deliveryAddress || 'Chưa nhập địa chỉ'}</div>
              </>
            )}
            {form.cardMessage && (
              <div style={{ background: '#fff', padding: '6px 10px', borderRadius: 6, marginTop: 6, border: '1px solid #e7e5e4' }}>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MessageSquare size={12} /> Nội dung thiệp:
                </strong>{' '}
                {form.cardMessage}
              </div>
            )}
            {form.notes && <div><strong>Ghi chú:</strong> {form.notes}</div>}
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #d6d3d1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Tổng: {formatMoney(totalAmount)}</span>
              <strong style={{ color: remainingAmount > 0 ? '#e11d48' : '#10b981' }}>
                {remainingAmount > 0 ? `Thu thêm: ${formatMoney(remainingAmount)}` : 'Đã thu đủ 100%'}
              </strong>
            </div>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Printer size={13} />
                <span>In Phiếu Ngay</span>
              </button>
            </div>
          </div>
        )}

        <form id="orderForm" onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Row 1: Khách hàng & SĐT */}
            <div className="form-row">
              <div className="form-group">
                <label>Tên Khách Hàng / Nickname *</label>
                <input
                  type="text"
                  id="orderCustomerName"
                  required
                  placeholder="VD: Ngọc Anh, binji..."
                  value={form.customerName}
                  onChange={e => set('customerName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Số Điện Thoại Khách</label>
                <input
                  type="tel"
                  id="orderPhone"
                  placeholder="VD: 0987654321"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Kênh & Trạng thái */}
            <div className="form-row">
              <div className="form-group">
                <label>Kênh Tiếp Nhận</label>
                <select id="orderChannel" value={form.channel} onChange={e => set('channel', e.target.value)}>
                  <option value="Thread">Thread</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram (Direct)</option>
                  <option value="Zalo">Zalo</option>
                  <option value="Điện thoại">Điện thoại / Hotline</option>
                  <option value="Tại tiệm">Khách ghé tiệm</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trạng Thái Đơn</label>
                <select
                  id="orderStatusSelect"
                  value={form.status}
                  onChange={e => {
                    const nextStatus = e.target.value;
                    if (nextStatus === 'completed' && form.status !== 'completed') {
                      setShowDeliveryConfirm(true);
                    } else {
                      set('status', nextStatus);
                    }
                  }}
                >
                  <option value="pending">Chờ cắm hoa</option>
                  <option value="ready">Đã bó xong</option>
                  <option value="completed">Đã giao (Thu đủ)</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>

            {/* Row 2.5: Người tiếp nhận & xử lý đơn */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <UserCheck size={14} color="var(--primary)" />
                <span>Người Tiếp Nhận &amp; Xử Lý Đơn *</span>
              </label>
              <select
                id="orderAssignedUser"
                value={form.assignedUserId || ''}
                onChange={e => {
                  const selectedId = e.target.value;
                  const found = assignees.find(u => u.id === selectedId);
                  setForm(prev => ({
                    ...prev,
                    assignedUserId: selectedId,
                    assignedUserName: found ? found.name : ''
                  }));
                }}
              >
                <option value="">-- Chọn người tiếp nhận --</option>
                {assignees.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Quản lý' : 'Nhân viên'})
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Mẫu hoa & Preset */}
            <div className="form-group">
              <label>Mẫu Hoa / Sản Phẩm *</label>
              <input
                type="text"
                id="orderProduct"
                required
                placeholder="VD: Sophia mix sao xanh, Bó hồng đỏ..."
                value={form.productName}
                onChange={e => set('productName', e.target.value)}
              />
              <div className="preset-pills" style={{ marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Sparkles size={11} /> Mẫu hot:
                </span>
                {FLOWER_PRESETS.map(p => (
                  <span
                    key={p.name}
                    className="preset-pill preset-flower"
                    onClick={() => {
                      set('productName', p.name);
                      set('unitPrice', p.price);
                    }}
                  >
                    {p.name} ({(p.price / 1000).toFixed(0)}k)
                  </span>
                ))}
              </div>
            </div>

            {/* Ảnh mẫu tham chiếu (Reference Photos) - Ngay dưới Mẫu hoa */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <Camera size={15} color="var(--primary)" />
                  <span>Ảnh Tham Chiếu Mẫu Hoa</span>
                </span>
                {form.images?.length > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                    {form.images.length} ảnh đã chọn
                  </span>
                )}
              </label>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>
                Tải ảnh mẫu khách yêu cầu hoặc chụp trực tiếp hoa tại tiệm (không bắt buộc, có thể thêm nhiều ảnh).
              </p>

              {/* Action buttons: Chụp ảnh trực tiếp (In-App Live Camera) & Chọn từ thư viện */}
              <div className="order-photo-actions" style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    flex: '1 1 calc(50% - 4px)',
                    justifyContent: 'center',
                    cursor: isUploadingImages ? 'not-allowed' : 'pointer',
                    opacity: isUploadingImages ? 0.6 : 1,
                    margin: 0,
                    touchAction: 'manipulation',
                    userSelect: 'none'
                  }}
                  disabled={isUploadingImages}
                  onClick={() => setShowInAppCamera(true)}
                  title="Chụp ảnh trực tiếp trong trình duyệt (Không bị tắt tab)"
                >
                  <Camera size={16} />
                  <span>Chụp Ảnh Trực Tiếp</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    flex: '1 1 calc(50% - 4px)',
                    justifyContent: 'center',
                    cursor: isUploadingImages ? 'not-allowed' : 'pointer',
                    opacity: isUploadingImages ? 0.6 : 1,
                    margin: 0,
                    touchAction: 'manipulation',
                    userSelect: 'none'
                  }}
                  disabled={isUploadingImages}
                  onClick={() => fileInputRef.current?.click()}
                  title="Chọn ảnh có sẵn hoặc dùng camera máy"
                >
                  <Upload size={16} />
                  <span>Chọn Từ Thư Viện / Máy</span>
                </button>

                {/* Hidden File Input tách rời hoàn toàn, không lồng trong label */}
                <input
                  ref={fileInputRef}
                  id="orderLibraryUploadInput"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  disabled={isUploadingImages}
                  onChange={handleImageUpload}
                />
              </div>

              {/* In-App Live Camera Modal */}
              <InAppCameraModal
                isOpen={showInAppCamera}
                onClose={() => setShowInAppCamera(false)}
                onCapture={handleDirectPhotoCaptured}
                onFallbackToFile={() => fileInputRef.current?.click()}
              />

              {/* Uploading progress banner */}
              {isUploadingImages && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--bg-muted)',
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10
                }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang nén và tải ảnh lên hệ thống...</span>
                </div>
              )}

              {/* Uploaded Photos Grid */}
              {form.images && form.images.length > 0 ? (
                <div className="order-photo-grid">
                  {form.images.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="order-photo-item">
                      <img src={url} alt={`Mẫu hoa ${idx + 1}`} />
                      {idx === 0 && <span className="photo-primary-badge">Ảnh chính</span>}
                      <button
                        type="button"
                        className="photo-delete-btn"
                        title="Xóa ảnh này"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '14px 16px',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 8,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 12.5,
                  background: 'var(--bg-app)'
                }}>
                  Chưa có ảnh nào được tải lên cho mẫu hoa này
                </div>
              )}
            </div>

            {/* Row 4: Số lượng & Đơn giá */}
            <div className="form-row">
              <div className="form-group">
                <label>Số Lượng Bó</label>
                <input
                  type="number"
                  id="orderQty"
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
                  id="orderUnitPrice"
                  min="0"
                  step="any"
                  placeholder="0"
                  required
                  value={form.unitPrice}
                  onChange={e => set('unitPrice', e.target.value)}
                />
              </div>
            </div>

            {/* Row 5: Tiền cọc & Trợ lý tính cọc */}
            <div className="form-row">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Tiền Đã Cọc (VNĐ)</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 10.5, padding: '2px 6px', height: 'auto', minHeight: 24 }}
                      onClick={() => handleQuickDeposit('zero')}
                    >
                      Chưa cọc
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 10.5, padding: '2px 6px', height: 'auto', minHeight: 24 }}
                      onClick={() => handleQuickDeposit('half')}
                    >
                      Cọc 50%
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 10.5, padding: '2px 6px', height: 'auto', minHeight: 24 }}
                      onClick={() => handleQuickDeposit('full')}
                    >
                      Đã thu 100%
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  id="orderDeposit"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={form.depositAmount}
                  onChange={e => set('depositAmount', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Tổng Tiền Đơn Hàng</label>
                <input
                  type="text"
                  id="orderTotal"
                  readOnly
                  style={{ background: 'var(--bg-app)', fontWeight: 700 }}
                  value={formatMoney(totalAmount)}
                />
              </div>
            </div>

            {/* Công nợ còn lại */}
            <div style={{
              background: remainingAmount > 0 ? '#fff1f2' : '#f0fdf4',
              border: `1px solid ${remainingAmount > 0 ? '#fecdd3' : '#bbf7d0'}`,
              padding: '10px 14px',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: remainingAmount > 0 ? '#be123c' : '#15803d' }}>
                {remainingAmount > 0 ? 'Số Tiền Còn Lại Phải Thu (Công Nợ):' : 'Đơn Hàng Đã Thu Đủ Tiền:'}
              </span>
              <strong style={{ fontSize: 16, color: remainingAmount > 0 ? '#e11d48' : '#16a34a' }}>
                {formatMoney(remainingAmount)}
              </strong>
            </div>

            {/* Row 6: Ngày & Giờ giao */}
            <div className="form-row">
              {/* Ngày Hẹn Giao (Calendar Date Picker) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span>Ngày Hẹn Nhận *</span>
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 10.5, padding: '2px 6px', height: 'auto', minHeight: 24 }}
                      onClick={() => handleQuickDate('today')}
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 10.5, padding: '2px 6px', height: 'auto', minHeight: 24 }}
                      onClick={() => handleQuickDate('tomorrow')}
                    >
                      Ngày mai
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 10.5, padding: '2px 6px', height: 'auto', minHeight: 24, color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                      onClick={() => handleQuickDate('oct20')}
                    >
                      <Flame size={12} color="#f97316" />
                      <span>20/10</span>
                    </button>
                  </div>
                </div>
                <DatePicker
                  id="orderDeliveryDate"
                  required
                  value={form.deliveryDate}
                  onChange={(dmy) => set('deliveryDate', dmy)}
                  placeholder="Chọn ngày hẹn giao (dd/mm/yyyy)"
                />
                {form.deliveryDate && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    <span>{getFriendlyDatePreview(form.deliveryDate)}</span>
                  </div>
                )}
              </div>

              {/* Khung Giờ Hẹn (Manual Input + 35 Time Tags) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} color="var(--primary)" />
                    <span>Khung Giờ Lấy</span>
                  </label>
                  {/* Mini Session Filters */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button
                      type="button"
                      className={`filter-pill-mini ${timeSession === 'all' ? 'active' : ''}`}
                      onClick={() => setTimeSession('all')}
                      title="Tất cả 35 mốc giờ (06:00 - 23:00)"
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      className={`filter-pill-mini ${timeSession === 'morning' ? 'active' : ''}`}
                      onClick={() => setTimeSession('morning')}
                      title="Buổi sáng (06:00 - 11:30)"
                    >
                      Sáng
                    </button>
                    <button
                      type="button"
                      className={`filter-pill-mini ${timeSession === 'afternoon' ? 'active' : ''}`}
                      onClick={() => setTimeSession('afternoon')}
                      title="Buổi chiều (12:00 - 17:30)"
                    >
                      Chiều
                    </button>
                    <button
                      type="button"
                      className={`filter-pill-mini ${timeSession === 'evening' ? 'active' : ''}`}
                      onClick={() => setTimeSession('evening')}
                      title="Buổi tối (18:00 - 23:00)"
                    >
                      Tối
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  id="orderTime"
                  placeholder="Gõ giờ hoặc bấm tag bên dưới (VD: 10:00, 16h30...)"
                  value={form.deliveryTime}
                  onChange={e => set('deliveryTime', e.target.value)}
                />

                {/* 35 Tag chọn nhanh cách nhau 30 phút */}
                <div className="time-tags-container" id="timeTagsList">
                  {filteredTimeSlots.map(t => {
                    const isSelected = form.deliveryTime === t;
                    return (
                      <span
                        key={t}
                        className={`preset-time ${isSelected ? 'active' : ''}`}
                        onClick={() => set('deliveryTime', t)}
                        role="button"
                        tabIndex={0}
                        title={`Chọn giờ ${t}`}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 7: Hình thức nhận */}
            <div className="form-group">
              <label>Hình Thức Nhận Hoa</label>
              <select id="orderDeliveryType" value={form.deliveryType} onChange={e => set('deliveryType', e.target.value)}>
                <option value="Khách qua lấy">Khách tự qua tiệm lấy</option>
                <option value="Giao hàng / Book ship">Giao hàng tận nơi (Book ship)</option>
              </select>
            </div>

            {/* Conditional Delivery Address & Recipient Fields */}
            {form.deliveryType === 'Giao hàng / Book ship' && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 12,
                marginBottom: 14
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Truck size={14} />
                  <span>Thông Tin Giao Hàng &amp; Người Nhận</span>
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Địa Chỉ Giao Hàng Chi Tiết *</label>
                  <input
                    type="text"
                    id="orderDeliveryAddress"
                    placeholder="VD: Số 12 ngõ 34 Hoàng Cầu, Đống Đa, Hà Nội"
                    value={form.deliveryAddress}
                    onChange={e => set('deliveryAddress', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Tên Người Nhận (nếu khác khách đặt)</label>
                    <input
                      type="text"
                      id="orderRecipientName"
                      placeholder="VD: Chị Mai, Lan..."
                      value={form.recipientName}
                      onChange={e => set('recipientName', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>SĐT Người Nhận</label>
                    <input
                      type="tel"
                      id="orderRecipientPhone"
                      placeholder="VD: 0912345678"
                      value={form.recipientPhone}
                      onChange={e => set('recipientPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Thiệp chúc mừng */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MessageSquare size={13} color="var(--primary)" />
                <span>Nội Dung Thiệp / Banner Chúc Mừng</span>
              </label>
              <textarea
                id="orderCardMessage"
                rows={2}
                placeholder="VD: Chúc mừng ngày 20/10 em yêu luôn xinh đẹp và hạnh phúc! - Từ anh Quân"
                value={form.cardMessage}
                onChange={e => set('cardMessage', e.target.value)}
              />
            </div>

            {/* Ghi chú thêm */}
            <div className="form-group">
              <label>Ghi Chú Yêu Cầu Cho Thợ Cắm Hoa</label>
              <textarea
                id="orderNotes"
                rows={2}
                placeholder="VD: Gói giấy màu xám nhạt, buộc nơ lụa dài, hoa tươi nở vừa..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 10 }}>
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmDelete(true)}
                  style={{
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                    background: 'rgba(239, 68, 68, 0.05)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Xóa vĩnh viễn đơn hàng này"
                >
                  <Trash2 size={15} />
                  <span>Xóa Đơn Hàng</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Lưu Thay Đổi Đơn Hàng' : 'Tạo Đơn Hàng Mới'}
              </button>
            </div>
          </div>
        </form>

        {/* Modal Xác Nhận Xóa Đơn Hàng */}
        <ConfirmDeleteModal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Xóa Đơn Hàng"
          itemName={`${order?.id || ''} — ${order?.customerName || ''} (${formatMoney(order?.totalAmount || 0)})`}
          message="Hành động này sẽ xóa vĩnh viễn đơn hàng này khỏi hệ thống. Bạn có chắc chắn muốn xóa không?"
          confirmText="Xóa Đơn Hàng"
          isDeleting={isDeleting}
        />

        {/* Modal Xác Nhận Đã Nhận Đủ Tiền Khi Chọn Đã Giao */}
        <ConfirmDeliveryModal
          isOpen={showDeliveryConfirm}
          onClose={() => setShowDeliveryConfirm(false)}
          onConfirm={() => {
            setForm(prev => ({ ...prev, status: 'completed', depositAmount: totalAmount }));
            setShowDeliveryConfirm(false);
          }}
          order={{
            id: order?.id || 'Đơn hàng mới',
            customerName: form.customerName || 'Khách hàng',
            productName: form.productName || 'Mẫu hoa',
            quantity,
            totalAmount,
            depositAmount: form.depositAmount,
            remainingAmount
          }}
        />
      </div>
    </div>
  );
}

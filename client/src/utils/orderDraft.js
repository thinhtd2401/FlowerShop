/**
 * utils/orderDraft.js - Quản lý bản nháp tạo đơn hàng qua localStorage
 * Giúp phục hồi 100% dữ liệu nếu người dùng bị reload trang do Android LMK / chuyển app
 */

export const ORDER_DRAFT_KEY = 'floral_order_draft';
export const ORDER_MODAL_OPEN_KEY = 'floral_order_modal_open';

/**
 * Lưu bản nháp tạo đơn
 */
export function saveOrderDraft(formData) {
  try {
    if (!formData) return;
    localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(formData));
    localStorage.setItem(ORDER_MODAL_OPEN_KEY, 'true');
  } catch (err) {
    console.warn('Không thể lưu bản nháp vào localStorage:', err);
  }
}

/**
 * Lấy bản nháp đã lưu
 */
export function getOrderDraft() {
  try {
    const raw = localStorage.getItem(ORDER_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Lỗi đọc bản nháp từ localStorage:', err);
    return null;
  }
}

/**
 * Xóa sạch bản nháp khi hoàn thành đơn hoặc người dùng hủy
 */
export function clearOrderDraft() {
  try {
    localStorage.removeItem(ORDER_DRAFT_KEY);
    localStorage.removeItem(ORDER_MODAL_OPEN_KEY);
  } catch (err) {
    console.warn('Lỗi xóa bản nháp:', err);
  }
}

/**
 * Cập nhật trạng thái mở modal
 */
export function setOrderModalOpenFlag(isOpen) {
  try {
    if (isOpen) {
      localStorage.setItem(ORDER_MODAL_OPEN_KEY, 'true');
    } else {
      localStorage.removeItem(ORDER_MODAL_OPEN_KEY);
    }
  } catch {}
}

/**
 * Kiểm tra xem modal có nên tự động mở lại sau khi trang bị reload không
 */
export function shouldAutoRestoreOrderModal() {
  try {
    return localStorage.getItem(ORDER_MODAL_OPEN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Kiểm tra xem form có nội dung nhập liệu đáng kể không (để hỏi xác nhận khi hủy)
 */
export function hasSubstantialData(form) {
  if (!form) return false;
  return Boolean(
    (form.customerName && form.customerName.trim()) ||
    (form.phone && form.phone.trim()) ||
    (form.productName && form.productName.trim()) ||
    (form.notes && form.notes.trim()) ||
    (form.cardMessage && form.cardMessage.trim()) ||
    (form.images && form.images.length > 0)
  );
}

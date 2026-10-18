/**
 * utils/format.js - Formatting helpers
 */

export function formatMoney(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return dateStr;
}

export const STATUS_MAP = {
  pending: { label: 'Chờ cắm', className: 'status-pending' },
  ready: { label: 'Đã bó xong', className: 'status-ready' },
  completed: { label: 'Đã giao', className: 'status-completed' },
  cancelled: { label: 'Đã hủy', className: 'status-cancelled' },
};

export function getStatusInfo(status) {
  return STATUS_MAP[status] || { label: status, className: 'status-pending' };
}

/**
 * Chuyển đổi định dạng ngày (DD/MM/YYYY, YYYY-MM-DD, DD/MM, Date object) sang chuẩn YYYY-MM-DD để so sánh
 */
export function parseDateToComparable(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
    const d = String(dateStr.getDate()).padStart(2, '0');
    const m = String(dateStr.getMonth() + 1).padStart(2, '0');
    const y = dateStr.getFullYear();
    return `${y}-${m}-${d}`;
  }
  if (typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // DD/MM/YYYY
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // DD/MM
  if (parts.length === 2) {
    const [d, m] = parts;
    const y = '2026';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/**
 * Chuyển đổi bất kỳ giá trị ngày nào sang chuỗi định dạng chuẩn dd/mm/yyyy
 */
export function formatToDDMMYYYY(val) {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const trimmed = String(val).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }
  // DD/MM/YYYY
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y.padStart(4, '20')}`;
  }
  // DD/MM
  if (parts.length === 2) {
    const [d, m] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/2026`;
  }
  return trimmed;
}

/**
 * Chuyển đổi ngày sang ISO YYYY-MM-DD phục vụ value cho input[type="date"]
 */
export function formatToYYYYMMDD(val) {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${y}-${m}-${d}`;
  }
  const trimmed = String(val).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // DD/MM/YYYY
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // DD/MM
  if (parts.length === 2) {
    const [d, m] = parts;
    const y = '2026';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

/**
 * Chuyển đổi timestamp tạo đơn (SQLite UTC hoặc ISO string) sang giờ địa phương định dạng 24h HH:mm:ss
 */
export function formatOrderTime(createdAtStr) {
  if (!createdAtStr) return '';
  try {
    let dateObj;
    if (createdAtStr.includes('T') || createdAtStr.endsWith('Z')) {
      dateObj = new Date(createdAtStr);
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(createdAtStr)) {
      // Chuyển SQLite UTC timestamp "YYYY-MM-DD HH:MM:SS" sang UTC Date
      dateObj = new Date(createdAtStr.replace(' ', 'T') + 'Z');
    } else {
      dateObj = new Date(createdAtStr);
    }

    if (isNaN(dateObj.getTime())) return '';

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
  } catch {
    return '';
  }
}


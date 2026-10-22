/**
 * utils/exportExcel.js - Xuất báo cáo tài chính, đơn hàng và chi phí ra Excel đa trang (.xlsx)
 */
import * as XLSX from 'xlsx';
import { formatOrderTime } from './format';

export function exportToExcel(orders = [], expenses = []) {
  const wb = XLSX.utils.book_new();

  // Helper formats
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const displayTime = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  // 1. Calculations for General Statistics (loại trừ đơn hủy)
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (parseInt(o.totalAmount, 10) || 0), 0);
  const totalDeposit = activeOrders.reduce((sum, o) => sum + (parseInt(o.depositAmount, 10) || 0), 0);
  const totalRemaining = activeOrders.reduce((sum, o) => sum + (parseInt(o.remainingAmount, 10) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseInt(e.amount, 10) || 0), 0);

  const completedOrders = activeOrders.filter(o => o.status === 'completed');
  const pendingOrders = activeOrders.filter(o => o.status !== 'completed');
  const peakOrders = activeOrders.filter(o => (o.deliveryDate || '').includes('20/10'));
  const totalBouquets = activeOrders.reduce((sum, o) => sum + (parseInt(o.quantity, 10) || 1), 0);

  // Cash in wallet: 100% of completed + deposits of pending
  const cashInWallet = completedOrders.reduce((sum, o) => sum + (parseInt(o.totalAmount, 10) || 0), 0) +
                       pendingOrders.reduce((sum, o) => sum + (parseInt(o.depositAmount, 10) || 0), 0);
  const netActualProfit = cashInWallet - totalExpenses;
  const projectedTotalProfit = totalRevenue - totalExpenses;
  const marginPct = totalRevenue > 0 ? ((projectedTotalProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%';

  // Channel breakdown (chỉ tính đơn hiệu lực)
  const channelMap = {};
  activeOrders.forEach(o => {
    const ch = o.channel || 'Khác';
    channelMap[ch] = (channelMap[ch] || 0) + 1;
  });

  // --- SHEET 1: Thống Kê Chung ---
  const statsRows = [
    ['BÁO CÁO TỔNG QUAN KINH DOANH & TÀI CHÍNH - KHFLOWER SHOP'],
    [`Thời gian xuất: ${displayTime}`],
    [],
    ['I. CHỈ SỐ TÀI CHÍNH & DÒNG TIỀN (VNĐ)', 'GIÁ TRỊ', 'GHI CHÚ'],
    ['Tổng doanh thu dự kiến', totalRevenue, 'Toàn bộ đơn hàng hiệu lực mùa lễ'],
    ['Tiền thực nhận (về ví)', cashInWallet, 'Đã thu 100% đơn giao + Tiền cọc đơn chờ'],
    ['Tổng vốn bỏ ra', totalExpenses, 'Chi phí hoa tươi, phụ liệu gói, nhân công, ăn uống'],
    ['Lợi nhuận thực thu', netActualProfit, 'Tiền về ví - Tổng vốn chi'],
    ['Công nợ còn phải thu', totalRemaining, 'Cần thu nốt khi giao các đơn còn lại'],
    ['Lợi nhuận toàn mùa dự kiến', projectedTotalProfit, 'Doanh thu dự kiến - Tổng vốn chi'],
    ['Biên lãi gộp dự kiến', marginPct, 'Tỷ suất lợi nhuận trên tổng doanh thu'],
    [],
    ['II. THỐNG KÊ VẬN HÀNH ĐƠN HÀNG', 'SỐ LƯỢNG', 'ĐƠN VỊ'],
    ['Tổng số đơn hiệu lực', activeOrders.length, 'Đơn'],
    ['Đơn đã hủy', cancelledOrders.length, 'Đơn'],
    ['Tổng số lượng bó hoa', totalBouquets, 'Bó hoa'],
    ['Đơn đã giao hoàn tất', completedOrders.length, 'Đơn'],
    ['Đơn đang chờ cắm / giao', pendingOrders.length, 'Đơn'],
    ['Đơn giao đợt cao điểm 20/10', peakOrders.length, 'Đơn'],
    ['Tổng số khoản chi vốn', expenses.length, 'Khoản'],
    [],
    ['III. PHÂN BỔ THEO KÊNH TIẾP NHẬN', 'SỐ ĐƠN', 'TỶ LỆ (%)'],
    ...Object.entries(channelMap).map(([ch, count]) => [
      ch,
      count,
      orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) + '%' : '0%'
    ])
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
  wsStats['!cols'] = [{ wch: 36 }, { wch: 20 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Thống Kê Chung');

  // --- SHEET 2: Danh Sách Đơn Hàng ---
  const statusLabels = {
    pending: 'Chờ cắm hoa',
    ready: 'Đã bó xong',
    completed: 'Đã giao',
    cancelled: 'Đã hủy'
  };

  const orderHeaders = [
    'STT',
    'Mã Đơn',
    'Ngày Đặt',
    'Khách Hàng',
    'Số Điện Thoại',
    'Kênh Tiếp Nhận',
    'Mẫu Hoa / Sản Phẩm',
    'Số Lượng (Bó)',
    'Đơn Giá (VNĐ)',
    'Tổng Tiền (VNĐ)',
    'Tiền Cọc (VNĐ)',
    'Còn Lại (VNĐ)',
    'Ngày Hẹn Giao',
    'Giờ Hẹn',
    'Hình Thức',
    'Địa Chỉ Giao',
    'Trạng Thái',
    'Ghi Chú Làm Hoa',
    'Nội Dung Thiệp'
  ];

  const orderRows = orders.map((o, idx) => {
    const timeStr = formatOrderTime(o.createdAt);
    const orderDateWithTime = timeStr ? `${o.orderDate || ''} ${timeStr}`.trim() : (o.orderDate || '');
    return [
      idx + 1,
      o.id || '',
      orderDateWithTime,
      o.customerName || '',
      o.phone || '',
      o.channel || '',
      o.productName || '',
    parseInt(o.quantity, 10) || 1,
    parseInt(o.unitPrice, 10) || 0,
    parseInt(o.totalAmount, 10) || 0,
    parseInt(o.depositAmount, 10) || 0,
    parseInt(o.remainingAmount, 10) || 0,
    o.deliveryDate || '',
    o.deliveryTime || '',
    o.deliveryType || '',
    o.deliveryAddress || '',
    statusLabels[o.status] || o.status || '',
    o.notes || '',
    o.cardMessage || ''
  ]});

  const wsOrders = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]);
  wsOrders['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã Đơn
    { wch: 12 }, // Ngày Đặt
    { wch: 20 }, // Khách Hàng
    { wch: 14 }, // Số Điện Thoại
    { wch: 15 }, // Kênh
    { wch: 28 }, // Mẫu Hoa
    { wch: 14 }, // Số Lượng
    { wch: 14 }, // Đơn Giá
    { wch: 15 }, // Tổng Tiền
    { wch: 14 }, // Tiền Cọc
    { wch: 14 }, // Còn Lại
    { wch: 14 }, // Ngày Hẹn
    { wch: 10 }, // Giờ Hẹn
    { wch: 16 }, // Hình Thức
    { wch: 28 }, // Địa Chỉ
    { wch: 14 }, // Trạng Thái
    { wch: 26 }, // Ghi Chú
    { wch: 35 }  // Thiệp
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Danh Sách Đơn Hàng');

  // --- SHEET 3: Chi Phí Vật Tư & Vốn ---
  const expenseHeaders = [
    'STT',
    'Mã Chi Phí',
    'Ngày Chi',
    'Phân Loại Chi Phí',
    'Tên Mặt Hàng / Chi Tiết Chi',
    'Số Lượng',
    'Đơn Vị Tính',
    'Đơn Giá (VNĐ)',
    'Tổng Tiền Chi (VNĐ)',
    'Ghi Chú'
  ];

  const expenseRows = expenses.map((e, idx) => [
    idx + 1,
    e.id || '',
    e.expenseDate || '',
    e.category || '',
    e.itemName || '',
    parseFloat(e.quantity) || 1,
    e.unit || '',
    parseInt(e.unitPrice, 10) || 0,
    parseInt(e.amount, 10) || 0,
    e.notes || ''
  ]);

  const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
  wsExpenses['!cols'] = [
    { wch: 6 },  // STT
    { wch: 12 }, // Mã CP
    { wch: 14 }, // Ngày Chi
    { wch: 22 }, // Phân Loại
    { wch: 32 }, // Mặt Hàng
    { wch: 10 }, // Số Lượng
    { wch: 12 }, // Đơn Vị
    { wch: 14 }, // Đơn Giá
    { wch: 18 }, // Tổng Tiền
    { wch: 26 }  // Ghi Chú
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Chi Phí Vật Tư & Vốn');

  // Write and trigger download
  XLSX.writeFile(wb, `Bao_Cao_KHflower_Shop_${dateStr}.xlsx`);
}

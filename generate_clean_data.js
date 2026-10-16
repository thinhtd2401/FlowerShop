/**
 * generate_clean_data.js
 * Reads 16_10_2026.xlsx, cleans orders and expenses data, matches with SQLite schema,
 * and outputs clean_data.xlsx in the root workspace folder.
 */
const XLSX = require('xlsx');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '16_10_2026.xlsx');
const OUTPUT_FILE = path.join(__dirname, 'clean_data.xlsx');

const wbSource = XLSX.readFile(SOURCE_FILE, { raw: false });
const sheetSource = wbSource.Sheets['Sheet1'];

// Helper to parse diverse date formats into standard DD/MM/YYYY
function parseDateCell(rawVal, fmtVal) {
  if (!rawVal && !fmtVal) return '';
  const s = String(fmtVal || rawVal).trim();
  
  // Format DD/MM/YY (e.g., 11/10/26, 12/10/26)
  const mShort = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mShort) {
    const day = mShort[1].padStart(2, '0');
    const month = mShort[2].padStart(2, '0');
    return `${day}/${month}/20${mShort[3]}`;
  }

  // Format DD/MM (e.g., 15/10)
  const mNoYear = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (mNoYear) {
    const day = mNoYear[1].padStart(2, '0');
    const month = mNoYear[2].padStart(2, '0');
    return `${day}/${month}/2026`;
  }

  // Format DD/MM/YYYY (e.g., 13/10/2026)
  const mFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mFull) {
    const day = mFull[1].padStart(2, '0');
    const month = mFull[2].padStart(2, '0');
    return `${day}/${month}/${mFull[3]}`;
  }

  return s;
}

// ==========================================
// 1. CLEAN EXPENSES (Row 9 to 23, Col B to F)
// ==========================================
const cleanedExpenses = [];
for (let r = 9; r <= 23; r++) {
  const item = sheetSource['C' + r]?.v;
  if (!item || String(item).trim() === '') continue;

  const id = `EXP-${String(r - 8).padStart(3, '0')}`;
  const date = parseDateCell(sheetSource['B' + r]?.v, sheetSource['B' + r]?.w);
  const itemName = String(item).trim();
  const qty = Number(sheetSource['D' + r]?.v) || 1;
  const unitPrice = (Number(sheetSource['E' + r]?.v) || 0) * 1000;
  const totalCost = (Number(sheetSource['F' + r]?.v) || 0) * 1000;

  // Determine category
  let category = 'Hoa tươi';
  const itemLower = itemName.toLowerCase();
  if (
    itemLower.includes('giấy') ||
    itemLower.includes('xốp') ||
    itemLower.includes('nơ') ||
    itemLower.includes('túi') ||
    itemLower.includes('cốt') ||
    itemLower.includes('kéo')
  ) {
    category = 'Phụ liệu & Bao bì';
  } else if (itemLower.includes('ăn') || itemLower.includes('cơm') || itemLower.includes('nước')) {
    category = 'Vận hành';
  }

  cleanedExpenses.push({
    id,
    date,
    category,
    item_name: itemName,
    quantity: qty,
    unit_price: unitPrice,
    total_cost: totalCost,
    notes: `Nhập từ file 16_10_2026.xlsx dòng ${r}`
  });
}

// ==========================================
// 2. CLEAN ORDERS (Row 9 to 74, Col H to S)
// ==========================================
const cleanedOrders = [];
for (let r = 9; r <= 74; r++) {
  const stt = Number(sheetSource['H' + r]?.v);
  if (!stt) continue;

  const id = `DH-${String(stt).padStart(3, '0')}`;
  const orderDate = parseDateCell(sheetSource['I' + r]?.v, sheetSource['I' + r]?.w);
  const rawCustName = sheetSource['J' + r]?.v ? String(sheetSource['J' + r].v).trim() : '';
  const rawContact = sheetSource['K' + r]?.v ? String(sheetSource['K' + r].v).trim() : '';
  const productName = sheetSource['L' + r]?.v ? String(sheetSource['L' + r].v).trim() : 'Bó hoa tươi';
  const quantity = Number(sheetSource['M' + r]?.v) || 1;
  const unitPrice = (Number(sheetSource['N' + r]?.v) || 0) * 1000;
  const totalAmount = (Number(sheetSource['O' + r]?.v) || 0) * 1000;
  const depositAmount = (Number(sheetSource['P' + r]?.v) || 0) * 1000;
  const remainingAmount = (Number(sheetSource['Q' + r]?.v) || 0) * 1000;

  let deliveryDate = parseDateCell(sheetSource['R' + r]?.v, sheetSource['R' + r]?.w);
  const rawStatus = sheetSource['S' + r]?.v ? String(sheetSource['S' + r].v).trim() : '';
  const status = (rawStatus === 'Đã giao') ? 'completed' : 'pending';
  const statusVn = (rawStatus === 'Đã giao') ? 'Đã giao' : 'Chờ giao';

  // Parse contact info into phone, channel, delivery_time, delivery_type
  let channel = 'Instagram';
  let phone = '';
  let deliveryTime = '';
  let deliveryType = 'Khách qua lấy';
  let notesArr = [];

  const nameLower = rawCustName.toLowerCase();
  if (nameLower.includes('(zl)') || nameLower.includes('zalo') || nameLower.includes('zl')) {
    channel = 'Zalo';
  } else if (nameLower.includes('(ig)') || nameLower.includes('ig')) {
    channel = 'Instagram';
  }

  if (rawContact) {
    const phoneMatch = rawContact.match(/^0?([35789]\d{8})$/);
    if (phoneMatch) {
      phone = '0' + phoneMatch[1];
    } else {
      const cLower = rawContact.toLowerCase();
      if (cLower.includes('zl') || cLower.includes('zalo')) {
        channel = 'Zalo';
      }
      if (cLower.includes('ig')) {
        channel = 'Instagram';
      }
      if (cLower.includes('ship') || cLower.includes('giao')) {
        deliveryType = 'Giao hàng / Book ship';
      }
      if (cLower.includes('qua lấy') || cLower.includes('lấy')) {
        deliveryType = 'Khách qua lấy';
      }

      // Check delivery time hints
      if (cLower.includes('6h15')) deliveryTime = '06:15';
      else if (cLower.includes('16h')) deliveryTime = '16:00';
      else if (cLower.includes('22h')) deliveryTime = '22:00';
      else if (cLower.includes('2h')) deliveryTime = '14:00';
      else if (cLower.includes('9h sáng')) deliveryTime = '09:00';
      else if (cLower.includes('8h')) deliveryTime = '08:00';
      else if (cLower.includes('6h chiều')) deliveryTime = '18:00';
      else if (cLower.includes('trưa')) deliveryTime = '11:30';
      else if (cLower.includes('9r')) deliveryTime = '09:30';

      notesArr.push(rawContact);
    }
  }

  const customerName = rawCustName || 'Khách vãng lai';

  cleanedOrders.push({
    id,
    order_date: orderDate,
    customer_name: customerName,
    channel,
    phone,
    product_name: productName,
    quantity,
    unit_price: unitPrice,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    remaining_amount: remainingAmount,
    delivery_date: deliveryDate || '',
    delivery_time: deliveryTime,
    delivery_type: deliveryType,
    delivery_address: '',
    card_message: '',
    recipient_name: '',
    recipient_phone: '',
    status,
    status_vn: statusVn,
    notes: notesArr.join('; ')
  });
}

// ==========================================
// 3. BUILD OUTPUT EXCEL WORKBOOK
// ==========================================
const wbOut = XLSX.utils.book_new();

// Sheet 1: Đơn hàng (Orders)
const ordersSheetData = cleanedOrders.map(o => ({
  'Mã Đơn (id)': o.id,
  'Ngày Nhận Đơn (order_date)': o.order_date,
  'Tên Khách Hàng (customer_name)': o.customer_name,
  'Kênh Bán (channel)': o.channel,
  'Số Điện Thoại (phone)': o.phone,
  'Loại Hoa / Sản Phẩm (product_name)': o.product_name,
  'Số Lượng (quantity)': o.quantity,
  'Đơn Giá (unit_price)': o.unit_price,
  'Tổng Tiền (total_amount)': o.total_amount,
  'Tiền Cọc (deposit_amount)': o.deposit_amount,
  'Còn Lại (remaining_amount)': o.remaining_amount,
  'Ngày Hẹn Giao (delivery_date)': o.delivery_date,
  'Giờ Hẹn Giao (delivery_time)': o.delivery_time,
  'Hình Thức Giao (delivery_type)': o.delivery_type,
  'Địa Chỉ Giao (delivery_address)': o.delivery_address,
  'Lời Chúc Thiệp (card_message)': o.card_message,
  'Người Nhận (recipient_name)': o.recipient_name,
  'SĐT Người Nhận (recipient_phone)': o.recipient_phone,
  'Trạng Thái DB (status)': o.status,
  'Trạng Thái Hiển Thị (status_vn)': o.status_vn,
  'Ghi Chú Gốc (notes)': o.notes
}));
const wsOrders = XLSX.utils.json_to_sheet(ordersSheetData);

// Set column widths for orders
wsOrders['!cols'] = [
  { wch: 10 }, // id
  { wch: 14 }, // order_date
  { wch: 22 }, // customer_name
  { wch: 12 }, // channel
  { wch: 14 }, // phone
  { wch: 28 }, // product_name
  { wch: 10 }, // quantity
  { wch: 14 }, // unit_price
  { wch: 14 }, // total_amount
  { wch: 14 }, // deposit_amount
  { wch: 14 }, // remaining_amount
  { wch: 14 }, // delivery_date
  { wch: 12 }, // delivery_time
  { wch: 20 }, // delivery_type
  { wch: 20 }, // delivery_address
  { wch: 20 }, // card_message
  { wch: 18 }, // recipient_name
  { wch: 16 }, // recipient_phone
  { wch: 14 }, // status
  { wch: 16 }, // status_vn
  { wch: 25 }  // notes
];
XLSX.utils.book_append_sheet(wbOut, wsOrders, 'Đơn Hàng (Orders)');

// Sheet 2: Chi phí vốn (Expenses)
const expensesSheetData = cleanedExpenses.map(e => ({
  'Mã Chi Phí (id)': e.id,
  'Ngày Chi (date)': e.date,
  'Danh Mục (category)': e.category,
  'Tên Mặt Hàng / Chi Phí (item_name)': e.item_name,
  'Số Lượng (quantity)': e.quantity,
  'Đơn Giá (unit_price)': e.unit_price,
  'Tổng Tiền Vốn (total_cost)': e.total_cost,
  'Ghi Chú (notes)': e.notes
}));
const wsExpenses = XLSX.utils.json_to_sheet(expensesSheetData);
wsExpenses['!cols'] = [
  { wch: 12 }, // id
  { wch: 14 }, // date
  { wch: 20 }, // category
  { wch: 25 }, // item_name
  { wch: 10 }, // quantity
  { wch: 14 }, // unit_price
  { wch: 16 }, // total_cost
  { wch: 35 }  // notes
];
XLSX.utils.book_append_sheet(wbOut, wsExpenses, 'Chi Phí Vốn (Expenses)');

// Sheet 3: Báo cáo đối chiếu & Tổng hợp (Summary)
const totalRev = cleanedOrders.reduce((acc, o) => acc + o.total_amount, 0);
const totalDep = cleanedOrders.reduce((acc, o) => acc + o.deposit_amount, 0);
const totalRem = cleanedOrders.reduce((acc, o) => acc + o.remaining_amount, 0);
const totalCost = cleanedExpenses.reduce((acc, e) => acc + e.total_cost, 0);
const completedOrders = cleanedOrders.filter(o => o.status === 'completed');
const pendingOrders = cleanedOrders.filter(o => o.status === 'pending');
const oct20Orders = cleanedOrders.filter(o => o.delivery_date === '20/10/2026');

// Tiền thực nhận = Toàn bộ tiền đơn đã giao (9.9M) + Tiền cọc của các đơn đang chờ giao (2.6M) = 12.5M
const deliveredRevenue = completedOrders.reduce((a, b) => a + b.total_amount, 0);
const pendingDeposit = pendingOrders.reduce((a, b) => a + b.deposit_amount, 0);
const actualCashReceived = deliveredRevenue + pendingDeposit;

const summaryData = [
  { 'Chỉ Số Thống Kê': 'Tổng số đơn hàng', 'Giá Trị': cleanedOrders.length, 'Đơn Vị': 'Đơn', 'Ghi Chú': 'Từ STT 1 đến STT 66' },
  { 'Chỉ Số Thống Kê': 'Tổng doanh thu dự kiến', 'Giá Trị': totalRev, 'Đơn Vị': 'VNĐ', 'Ghi Chú': 'Tổng giá trị tất cả 66 đơn đặt' },
  { 'Chỉ Số Thống Kê': 'TỔNG TIỀN THỰC NHẬN (Tiền về ví)', 'Giá Trị': actualCashReceived, 'Đơn Vị': 'VNĐ', 'Ghi Chú': 'Đơn đã giao (9.900.000 đ) + Cọc đơn chờ giao (2.600.000 đ) -> Khớp ô 12.500.000 đ' },
  { 'Chỉ Số Thống Kê': 'Số đơn đã giao (hoàn tất)', 'Giá Trị': completedOrders.length, 'Đơn Vị': 'Đơn', 'Ghi Chú': `Tổng tiền thu: ${deliveredRevenue.toLocaleString('vi-VN')} đ` },
  { 'Chỉ Số Thống Kê': 'Số đơn chờ giao', 'Giá Trị': pendingOrders.length, 'Đơn Vị': 'Đơn', 'Ghi Chú': `Đã cọc: ${pendingDeposit.toLocaleString('vi-VN')} đ | Còn lại: ${totalRem.toLocaleString('vi-VN')} đ` },
  { 'Chỉ Số Thống Kê': 'Tổng tiền cọc của các đơn chờ giao', 'Giá Trị': pendingDeposit, 'Đơn Vị': 'VNĐ', 'Ghi Chú': 'Tiền cọc của 29 đơn chuẩn bị giao' },
  { 'Chỉ Số Thống Kê': 'Tổng công nợ còn phải thu khi giao', 'Giá Trị': totalRem, 'Đơn Vị': 'VNĐ', 'Ghi Chú': 'Thu nốt khi giao thành công 29 đơn chờ' },
  { 'Chỉ Số Thống Kê': 'Đơn giao cao điểm 20/10', 'Giá Trị': oct20Orders.length, 'Đơn Vị': 'Đơn', 'Ghi Chú': `Tổng tiền: ${oct20Orders.reduce((a,b)=>a+b.total_amount,0).toLocaleString('vi-VN')} đ` },
  { 'Chỉ Số Thống Kê': 'Tổng chi phí vốn bỏ ra', 'Giá Trị': totalCost, 'Đơn Vị': 'VNĐ', 'Ghi Chú': 'Khớp ô 6.078.000 đ vốn trong Excel gốc' },
  { 'Chỉ Số Thống Kê': 'LỢI NHUẬN THỰC THU HIỆN TẠI', 'Giá Trị': actualCashReceived - totalCost, 'Đơn Vị': 'VNĐ', 'Ghi Chú': '12.500.000 đ - 6.078.000 đ -> Khớp ô 6.422.000 đ' },
  { 'Chỉ Số Thống Kê': 'Lợi nhuận gộp toàn mùa dự kiến', 'Giá Trị': totalRev - totalCost, 'Đơn Vị': 'VNĐ', 'Ghi Chú': '17.900.000 đ - 6.078.000 đ' },
  { 'Chỉ Số Thống Kê': 'Tỷ suất lợi nhuận / Doanh thu', 'Giá Trị': `${((totalRev - totalCost) / totalRev * 100).toFixed(2)}%`, 'Đơn Vị': '%', 'Ghi Chú': 'Biên lợi nhuận gộp' }
];

const wsSummary = XLSX.utils.json_to_sheet(summaryData);
wsSummary['!cols'] = [
  { wch: 32 },
  { wch: 18 },
  { wch: 12 },
  { wch: 45 }
];
XLSX.utils.book_append_sheet(wbOut, wsSummary, 'Báo Cáo Tổng Hợp (Summary)');

// Write file
XLSX.writeFile(wbOut, OUTPUT_FILE);
console.log(`\n✅ Generated clean data file successfully: ${OUTPUT_FILE}`);
console.log(`Orders: ${cleanedOrders.length}, Expenses: ${cleanedExpenses.length}`);

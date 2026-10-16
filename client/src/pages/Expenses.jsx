import { Flower2, Package, Coffee, Layers, Trash2, Pencil } from 'lucide-react';
import { formatMoney } from '../utils/format';

const CATEGORY_ICONS = {
  'Hoa tươi': Flower2,
  'Phụ liệu & Bao bì': Package,
  'Vận hành': Coffee,
  'Khác': Layers,
};

export default function Expenses({ expenses, onEditExpense, onDeleteExpense }) {
  const totalCapital = expenses.reduce((sum, e) => sum + (e.totalCost || 0), 0);

  const handleDelete = async (id) => {
    if (window.confirm('Xóa khoản chi phí này?')) {
      await onDeleteExpense(id);
    }
  };

  return (
    <section className="view-section active" id="expensesView">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Quản Lý Chi Phí Nhập Hàng &amp; Vật Tư</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Theo dõi tiền mua hoa tươi từ các chợ đầu mối, nhà vườn và phụ liệu cắm hoa</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng Vốn Đã Chi</span>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }} id="expenseTotalValue">{formatMoney(totalCapital)}</div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="table-responsive desktop-only-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã CP</th>
              <th>Ngày Chi</th>
              <th>Phân Loại</th>
              <th>Tên Mặt Hàng / Nội Dung</th>
              <th>Số Lượng</th>
              <th>Đơn Giá</th>
              <th>Tổng Tiền Chi</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="expensesTableBody">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  Chưa có khoản chi phí nào
                </td>
              </tr>
            ) : expenses.map(e => {
              const CategoryIcon = CATEGORY_ICONS[e.category] || Layers;
              return (
                <tr key={e.id}>
                  <td><strong>{e.id}</strong></td>
                  <td>{e.date}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CategoryIcon size={15} color="var(--primary)" />
                      <span>{e.category}</span>
                    </span>
                  </td>
                  <td><strong>{e.itemName}</strong></td>
                  <td>{e.quantity}</td>
                  <td>{formatMoney(e.unitPrice)}</td>
                  <td><strong style={{ color: '#d97706' }}>{formatMoney(e.totalCost)}</strong></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm btn-edit-expense"
                        onClick={() => onEditExpense(e)}
                        title="Chỉnh sửa">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => handleDelete(e.id)}
                        style={{ color: '#e11d48' }} title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only-cards" id="expensesMobileCards">
        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', background: '#fff', borderRadius: 12 }}>
            Chưa có khoản chi phí nào
          </div>
        ) : expenses.map(e => {
          const CategoryIcon = CATEGORY_ICONS[e.category] || Layers;
          return (
            <div key={e.id} className="mobile-expense-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{e.id} · {e.date}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => onEditExpense(e)} title="Chỉnh sửa">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(e.id)} style={{ color: '#e11d48' }} title="Xóa">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4, color: 'var(--text-main)' }}>{e.itemName}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border-light)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <CategoryIcon size={14} color="var(--primary)" />
                  <span>{e.category} (SL: {e.quantity})</span>
                </div>
                <div style={{ fontWeight: 700, color: '#d97706', fontSize: 15 }}>{formatMoney(e.totalCost)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

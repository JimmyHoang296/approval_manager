import { useState, useEffect, useMemo } from 'react';
import { getApprovalData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ApprovalModal from '../components/ApprovalModal';

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chưa xử lý' },
  { key: 'approved', label: 'Đồng ý' },
  { key: 'rejected', label: 'Không đồng ý' },
];

function ResultBadge({ value }) {
  if (value === 'Đồng ý') return <span className="badge badge-success">Đồng ý</span>;
  if (value === 'Không đồng ý') return <span className="badge badge-danger">Không đồng ý</span>;
  return <span className="badge badge-gray">Chưa xử lý</span>;
}

function truncate(str, n = 80) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

export default function ApprovalPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchData = () => {
    setLoading(true);
    getApprovalData(user.name, user.role, user.hod)
      .then(res => {
        if (res.success) setRows(res.data);
        else setError('Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(row => {
      const matchFilter =
        filter === 'all' ? true :
        filter === 'pending' ? !row.ketQua :
        filter === 'approved' ? row.ketQua === 'Đồng ý' :
        filter === 'rejected' ? row.ketQua === 'Không đồng ý' : true;

      const q = search.toLowerCase();
      const matchSearch = !q ||
        String(row.maViPham).includes(q) ||
        (row.tenNV || '').toLowerCase().includes(q) ||
        (row.phongBan || '').toLowerCase().includes(q) ||
        (row.noiDung || '').toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [rows, filter, search]);

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter(r => !r.ketQua).length,
    approved: rows.filter(r => r.ketQua === 'Đồng ý').length,
    rejected: rows.filter(r => r.ketQua === 'Không đồng ý').length,
  }), [rows]);

  const handleSaved = (rowIndex, ketQua, nguyenNhan, chiTiet) => {
    setRows(prev => prev.map(r =>
      r._rowIndex === rowIndex
        ? { ...r, ketQua, nguyenNhan, chiTiet }
        : r
    ));
    setSelected(null);
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Đang tải dữ liệu...</span>
    </div>
  );

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Danh sách Phê duyệt</h1>
          <p>Phân công cho: <strong>{user.name}</strong></p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchData}>
          ↻ Làm mới
        </button>
      </div>

      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <input
            className="search-input"
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã vi phạm</th>
                  <th>Tên nhân viên</th>
                  <th>Chức danh</th>
                  <th>Nội dung vi phạm</th>
                  <th>Hình thức xử lý</th>
                  <th style={{ textAlign: 'right' }}>Tiền phạt</th>
                  <th>Kết quả</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <div>📋</div>
                        <p>Không có vi phạm nào trong danh mục này</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(row => (
                  <tr key={row._rowIndex}>
                    <td>{row.stt}</td>
                    <td style={{ fontWeight: 500 }}>{row.maViPham}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{row.tenNV}</td>
                    <td>{row.chucDanh}</td>
                    <td>
                      <div className="cell-truncate" title={row.noiDung}>
                        {truncate(row.noiDung, 60)}
                      </div>
                    </td>
                    <td>
                      <div className="cell-truncate" title={row.hinhThuc}>
                        {truncate(row.hinhThuc, 50)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {row.soTienPhat
                        ? Number(row.soTienPhat).toLocaleString('vi-VN') + ' đ'
                        : '—'
                      }
                    </td>
                    <td><ResultBadge value={row.ketQua} /></td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelected(row)}
                      >
                        {row.ketQua ? 'Xem / Sửa' : 'Phê duyệt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <ApprovalModal
          record={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

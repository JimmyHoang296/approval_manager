import { useState, useEffect, useMemo } from 'react';
import { getApprovalData, batchSubmitApproval } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ApprovalModal from '../components/ApprovalModal';

const FILTERS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'pending',  label: 'Chưa xử lý' },
  { key: 'approved', label: 'Đồng ý' },
  { key: 'rejected', label: 'Không đồng ý' },
];

function ResultBadge({ value, isPending }) {
  const badge =
    value === 'Đồng ý'      ? <span className="badge badge-success">Đồng ý</span> :
    value === 'Không đồng ý' ? <span className="badge badge-danger">Không đồng ý</span> :
                               <span className="badge badge-gray">Chưa xử lý</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {badge}
      {isPending && (
        <span style={{ fontSize: 11, color: '#d97706', fontWeight: 500 }}>⏳ chờ đồng bộ</span>
      )}
    </div>
  );
}

function truncate(str, n = 60) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

export default function ApprovalPage() {
  const { user } = useAuth();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('pending');
  const [search, setSearch]   = useState('');

  // { [rowIndex]: { ketQua, nguyenNhan, chiTiet } } — locally saved, not yet synced
  const [pendingSync, setPendingSync] = useState({});
  const [syncing, setSyncing]         = useState(false);
  const [syncMsg, setSyncMsg]         = useState('');

  // Modal navigation: snapshot of current filtered list when modal opens
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalRecords, setModalRecords] = useState([]);
  const [modalIdx, setModalIdx]         = useState(0);

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
      const kq = row.ketQua;
      const matchFilter =
        filter === 'all'      ? true :
        filter === 'pending'  ? !kq :
        filter === 'approved' ? kq === 'Đồng ý' :
        filter === 'rejected' ? kq === 'Không đồng ý' : true;

      const q = search.toLowerCase();
      const matchSearch = !q ||
        String(row.maViPham).includes(q) ||
        (row.tenNV    || '').toLowerCase().includes(q) ||
        (row.phongBan || '').toLowerCase().includes(q) ||
        (row.noiDung  || '').toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [rows, filter, search]);

  const counts = useMemo(() => ({
    all:      rows.length,
    pending:  rows.filter(r => !r.ketQua).length,
    approved: rows.filter(r => r.ketQua === 'Đồng ý').length,
    rejected: rows.filter(r => r.ketQua === 'Không đồng ý').length,
  }), [rows]);

  // ---------- Modal open ----------
  const openModal = (idx) => {
    setModalRecords([...filtered]); // snapshot of current view
    setModalIdx(idx);
    setModalOpen(true);
  };

  // ---------- Save locally (no API call) ----------
  const handleSaveLocal = (rowIndex, ketQua, nguyenNhan, chiTiet) => {
    // Update main rows so table reflects new status
    setRows(prev => prev.map(r =>
      r._rowIndex === rowIndex ? { ...r, ketQua, nguyenNhan, chiTiet } : r
    ));
    // Track as pending sync
    setPendingSync(prev => ({ ...prev, [rowIndex]: { ketQua, nguyenNhan, chiTiet } }));
    // Update modal snapshot too so navigation sees updated data
    setModalRecords(prev => prev.map(r =>
      r._rowIndex === rowIndex ? { ...r, ketQua, nguyenNhan, chiTiet } : r
    ));
  };

  // ---------- Navigation handlers (used by modal) ----------
  const handlePrev = () => setModalIdx(i => Math.max(0, i - 1));
  const handleNext = () => setModalIdx(i => Math.min(modalRecords.length - 1, i + 1));

  const handleNextUnreviewed = () => {
    // Find next unreviewed starting AFTER current index (wrap around)
    const findFrom = (start, end) => {
      for (let i = start; i < end; i++) {
        if (!modalRecords[i]?.ketQua) return i;
      }
      return -1;
    };
    const found = findFrom(modalIdx + 1, modalRecords.length);
    if (found !== -1) { setModalIdx(found); return; }
    const wrapped = findFrom(0, modalIdx);
    if (wrapped !== -1) { setModalIdx(wrapped); return; }
    // All reviewed — stay, do nothing (modal shows toast)
  };

  const hasMoreUnreviewed = useMemo(() => {
    return modalOpen && modalRecords.some((r, i) => i !== modalIdx && !r.ketQua);
  }, [modalOpen, modalRecords, modalIdx]);

  // ---------- Batch sync ----------
  const pendingSyncCount = Object.keys(pendingSync).length;

  const handleSync = async () => {
    if (!pendingSyncCount) return;
    const confirmed = window.confirm(
      `Đồng bộ ${pendingSyncCount} biên bản đã phê duyệt lên Google Sheet?`
    );
    if (!confirmed) return;

    setSyncing(true);
    setSyncMsg('');
    try {
      const approvals = Object.entries(pendingSync).map(([rowIndex, d]) => ({
        rowIndex: Number(rowIndex),
        ...d,
      }));
      const res = await batchSubmitApproval(approvals);
      if (res.success) {
        setPendingSync({});
        setSyncMsg(res.message);
        setTimeout(() => setSyncMsg(''), 4000);
      } else {
        setSyncMsg('Lỗi: ' + (res.message || 'Không xác định'));
      }
    } catch {
      setSyncMsg('Không thể kết nối server');
    } finally {
      setSyncing(false);
    }
  };

  // ---------- Render ----------
  if (loading) return (
    <div className="loading"><div className="spinner" /><span>Đang tải dữ liệu...</span></div>
  );
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Danh sách Phê duyệt</h1>
          <p>Phân công cho: <strong>{user.name}</strong></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pendingSyncCount > 0 && (
            <button
              className="btn btn-success"
              onClick={handleSync}
              disabled={syncing}
              title="Cập nhật tất cả biên bản đã duyệt lên Google Sheet"
            >
              {syncing ? 'Đang đồng bộ...' : `↑ Đồng bộ phê duyệt (${pendingSyncCount})`}
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={fetchData}>↻ Làm mới</button>
        </div>
      </div>

      {syncMsg && (
        <div className={`alert ${syncMsg.startsWith('Lỗi') ? 'alert-error' : 'alert-success'}`}>
          {syncMsg}
        </div>
      )}

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
                ) : filtered.map((row, idx) => (
                  <tr key={row._rowIndex}>
                    <td>{row.stt}</td>
                    <td style={{ fontWeight: 500 }}>{row.maViPham}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{row.tenNV}</td>
                    <td>{row.chucDanh}</td>
                    <td>
                      <div className="cell-truncate" title={row.noiDung}>
                        {truncate(row.noiDung)}
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
                        : '—'}
                    </td>
                    <td>
                      <ResultBadge
                        value={row.ketQua}
                        isPending={!!pendingSync[row._rowIndex]}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openModal(idx)}
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

      {modalOpen && (
        <ApprovalModal
          records={modalRecords}
          currentIdx={modalIdx}
          onClose={() => setModalOpen(false)}
          onSaveLocal={handleSaveLocal}
          onPrev={handlePrev}
          onNext={handleNext}
          onNextUnreviewed={handleNextUnreviewed}
          hasMoreUnreviewed={hasMoreUnreviewed}
        />
      )}
    </div>
  );
}

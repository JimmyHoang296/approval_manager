import { useState, useEffect } from 'react';

const REASONS = [
  'Sai hình thức xử lý',
  'Lỗi vi phạm và/hoặc hình thức xử lý không phù hợp',
  'Nội dung vi phạm không rõ ràng',
  'Sai lỗi vi phạm',
  'Sai nhóm lỗi/lỗi vi phạm',
  'Sai nhóm lỗi',
  'Sai mức xử lý/nhóm rank',
];

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{value || '—'}</div>
    </div>
  );
}

export default function ApprovalModal({
  records,
  currentIdx,
  onClose,
  onSaveLocal,
  onPrev,
  onNext,
  onNextUnreviewed,
  hasMoreUnreviewed,
}) {
  const record = records[currentIdx];

  const [ketQua,     setKetQua]     = useState('');
  const [nguyenNhan, setNguyenNhan] = useState('');
  const [chiTiet,    setChiTiet]    = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');

  // Load form state whenever the displayed record changes
  useEffect(() => {
    if (!record) return;
    setKetQua(record.ketQua     || '');
    setNguyenNhan(record.nguyenNhan || '');
    setChiTiet(record.chiTiet   || '');
    setHasChanges(false);
    setError('');
  }, [currentIdx]); // intentionally only depends on index; parent keeps records fresh

  // --- Form change handlers ---
  const changeKetQua = (val) => {
    setKetQua(val);
    if (val === 'Đồng ý') { setNguyenNhan(''); setChiTiet(''); }
    setHasChanges(true);
    setError('');
  };
  const changeNguyenNhan = (val) => { setNguyenNhan(val); setHasChanges(true); };
  const changeChiTiet    = (val) => { setChiTiet(val);    setHasChanges(true); };

  // --- Save locally ---
  const handleSave = () => {
    if (!ketQua) { setError('Vui lòng chọn kết quả phê duyệt'); return; }
    if (ketQua === 'Không đồng ý' && !nguyenNhan) {
      setError('Vui lòng chọn nguyên nhân không đồng ý');
      return;
    }
    onSaveLocal(
      record._rowIndex,
      ketQua,
      ketQua === 'Đồng ý' ? '' : nguyenNhan,
      ketQua === 'Đồng ý' ? '' : chiTiet,
    );
    setHasChanges(false);
    setError('');
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  // --- Auto-save then navigate ---
  const navigate = (navFn) => {
    if (hasChanges && ketQua) {
      onSaveLocal(
        record._rowIndex,
        ketQua,
        ketQua === 'Đồng ý' ? '' : nguyenNhan,
        ketQua === 'Đồng ý' ? '' : chiTiet,
      );
      setHasChanges(false);
    }
    navFn();
  };

  if (!record) return null;

  const isPending  = !record.ketQua; // no decision yet in current snapshot
  const total      = records.length;
  const position   = currentIdx + 1;

  const fmt = (v) =>
    v && typeof v === 'number' ? v.toLocaleString('vi-VN') + ' đ' : v || '—';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ marginBottom: 2 }}>
              Biên bản #{record.maViPham}
              {hasChanges && (
                <span style={{ fontSize: 11, color: '#d97706', marginLeft: 8 }}>● chưa lưu</span>
              )}
              {savedFlash && (
                <span style={{ fontSize: 11, color: '#057a55', marginLeft: 8 }}>✓ Đã lưu cục bộ</span>
              )}
            </h3>
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {position} / {total} biên bản
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Navigation bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 24px', borderBottom: '1px solid var(--gray-200)',
          background: 'var(--gray-50)',
        }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate(onPrev)}
            disabled={currentIdx === 0}
          >
            ← Biên bản trước
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate(onNext)}
            disabled={currentIdx === total - 1}
          >
            Biên bản tiếp →
          </button>
          <button
            className="btn btn-sm"
            style={{
              background: hasMoreUnreviewed ? '#fef3c7' : 'var(--gray-100)',
              color:       hasMoreUnreviewed ? '#92400e' : 'var(--gray-400)',
              border:      hasMoreUnreviewed ? '1px solid #fbbf24' : '1px solid var(--gray-200)',
            }}
            onClick={() => navigate(onNextUnreviewed)}
            disabled={!hasMoreUnreviewed}
            title="Nhảy đến biên bản chưa phê duyệt tiếp theo"
          >
            ⚡ Chưa duyệt tiếp
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isPending
              ? <span className="badge badge-warning">Chưa xử lý</span>
              : record.ketQua === 'Đồng ý'
                ? <span className="badge badge-success">Đồng ý</span>
                : <span className="badge badge-danger">Không đồng ý</span>
            }
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Record details */}
          <div className="info-grid">
            <InfoItem label="Mã vi phạm"   value={record.maViPham} />
            <InfoItem label="Mã vụ việc"   value={record.maVuViec} />
            <InfoItem label="Mã nhân viên" value={record.maNV} />
            <InfoItem label="Tên nhân viên" value={record.tenNV} />
            <InfoItem label="Chức danh"    value={record.chucDanh} />
            <InfoItem label="Ngày lập BBVP" value={record.ngayLap} />
            <InfoItem label="Người lập"    value={record.nguoiLap} />
            <InfoItem label="Số tiền phạt" value={record.soTienPhat ? fmt(record.soTienPhat) : null} />
          </div>

          <div className="info-item" style={{ marginBottom: 10 }}>
            <div className="info-label">Nội dung vi phạm</div>
            <div className="info-value" style={{ fontSize: 13, lineHeight: 1.6 }}>{record.noiDung || '—'}</div>
          </div>
          <div className="info-item" style={{ marginBottom: 10 }}>
            <div className="info-label">Lỗi vi phạm</div>
            <div className="info-value" style={{ fontSize: 13, lineHeight: 1.6 }}>{record.loiViPham || '—'}</div>
          </div>
          <div className="info-item" style={{ marginBottom: 10 }}>
            <div className="info-label">Hình thức xử lý</div>
            <div className="info-value" style={{ fontSize: 13, lineHeight: 1.6 }}>{record.hinhThuc || '—'}</div>
          </div>

          <div className="divider" />

          {/* Approval form */}
          <div className="form-group">
            <label className="form-label">Kết quả phê duyệt — cột AI</label>
            <div className="radio-group">
              <label className="radio-option approve">
                <input
                  type="radio" name="ketQua" value="Đồng ý"
                  checked={ketQua === 'Đồng ý'}
                  onChange={() => changeKetQua('Đồng ý')}
                />
                <span>✓ Đồng ý</span>
              </label>
              <label className="radio-option reject">
                <input
                  type="radio" name="ketQua" value="Không đồng ý"
                  checked={ketQua === 'Không đồng ý'}
                  onChange={() => changeKetQua('Không đồng ý')}
                />
                <span>✗ Không đồng ý</span>
              </label>
            </div>
          </div>

          {ketQua === 'Không đồng ý' && (
            <>
              <div className="form-group">
                <label className="form-label">Nguyên nhân không phê duyệt — cột AJ</label>
                <select
                  className="form-control"
                  value={nguyenNhan}
                  onChange={e => changeNguyenNhan(e.target.value)}
                >
                  <option value="">-- Chọn nguyên nhân --</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Chi tiết nguyên nhân / Nội dung chỉnh sửa — cột AK
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={chiTiet}
                  onChange={e => changeChiTiet(e.target.value)}
                  placeholder="Nhập chi tiết nguyên nhân hoặc nội dung vi phạm cần chỉnh sửa..."
                />
              </div>
            </>
          )}

          {error && <div className="alert alert-error">{error}</div>}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span style={{ fontSize: 12, color: 'var(--gray-400)', marginRight: 'auto' }}>
            Lưu cục bộ trước, rồi dùng nút "Đồng bộ phê duyệt" để cập nhật lên sheet.
          </span>
          <button className="btn btn-outline" onClick={onClose}>Đóng</button>
          <button
            className={`btn ${
              ketQua === 'Đồng ý'      ? 'btn-success' :
              ketQua === 'Không đồng ý' ? 'btn-danger'  : 'btn-primary'
            }`}
            onClick={handleSave}
            disabled={!ketQua || !hasChanges}
          >
            {savedFlash ? '✓ Đã lưu' : '💾 Lưu cục bộ'}
          </button>
        </div>
      </div>
    </div>
  );
}

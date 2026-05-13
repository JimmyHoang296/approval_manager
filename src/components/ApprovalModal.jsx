import { useState, useEffect, useRef } from 'react';

const REASONS = [
  'Sai hình thức xử lý',
  'Lỗi vi phạm và/hoặc hình thức xử lý không phù hợp',
  'Nội dung vi phạm không rõ ràng',
  'Sai lỗi vi phạm',
  'Sai nhóm lỗi/lỗi vi phạm',
  'Sai nhóm lỗi',
  'Sai mức xử lý/nhóm rank',
];

// Small label + value pair
function KV({ label, value, mono, red }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, fontWeight: mono ? 600 : 400,
        color: red ? '#dc2626' : '#1f2937',
        fontFamily: mono ? 'monospace' : undefined,
      }}>
        {value || '—'}
      </div>
    </div>
  );
}

// Colored highlight block for violation details
function VBlock({ label, value, borderColor, bg }) {
  if (!value) return null;
  return (
    <div style={{
      borderLeft: `3px solid ${borderColor}`,
      background: bg,
      borderRadius: '0 6px 6px 0',
      padding: '8px 10px',
      marginBottom: 6,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: borderColor, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#1f2937', lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  );
}

export default function ApprovalModal({
  records, currentIdx,
  onClose, onSaveLocal,
  onPrev, onNext, onNextUnreviewed, hasMoreUnreviewed,
}) {
  const record = records[currentIdx];

  const [ketQua,     setKetQua]     = useState('');
  const [nguyenNhan, setNguyenNhan] = useState('');
  const [chiTiet,    setChiTiet]    = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!record) return;
    setKetQua(record.ketQua || '');
    setNguyenNhan(record.nguyenNhan || '');
    setChiTiet(record.chiTiet || '');
    setHasChanges(false);
    setError('');
  }, [currentIdx]);

  const doSave = () => {
    onSaveLocal(
      record._rowIndex, ketQua,
      ketQua === 'Đồng ý' ? '' : nguyenNhan,
      ketQua === 'Đồng ý' ? '' : chiTiet,
    );
    setHasChanges(false);
    setError('');
  };

  const handleSave = () => {
    if (!ketQua) { setError('Vui lòng chọn kết quả phê duyệt'); return; }
    if (ketQua === 'Không đồng ý' && !nguyenNhan) { setError('Vui lòng chọn nguyên nhân'); return; }
    doSave();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const navigate = (navFn) => {
    if (hasChanges && ketQua) doSave();
    navFn();
  };

  // Keyboard ← →
  const navRef = useRef({});
  navRef.current = { prev: () => navigate(onPrev), next: () => navigate(onNext), close: onClose };
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); navRef.current.prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navRef.current.next(); }
      if (e.key === 'Escape')     navRef.current.close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!record) return null;

  const total    = records.length;
  const position = currentIdx + 1;

  const fmtDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleDateString('vi-VN');
  };
  const fmtMoney = (v) =>
    v && !isNaN(Number(v)) ? Number(v).toLocaleString('vi-VN') + ' đ' : (v || null);

  const status =
    !record.ketQua             ? { bg: '#fef3c7', fg: '#92400e', label: 'Chưa xử lý' } :
    record.ketQua === 'Đồng ý' ? { bg: '#def7ec', fg: '#057a55', label: 'Đồng ý'     } :
                                  { bg: '#fde8e8', fg: '#c81e1e', label: 'Không đồng ý'};

  const S = { // shared inline style tokens
    sectionLabel: {
      fontSize: 10, fontWeight: 700, color: '#6b7280',
      textTransform: 'uppercase', letterSpacing: '.07em',
      marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5,
    },
    divLine: (color) => ({ width: 3, height: 10, background: color, borderRadius: 2, flexShrink: 0 }),
    card: {
      background: '#f9fafb', border: '1px solid #e5e7eb',
      borderRadius: 7, padding: '10px 12px',
    },
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        {/* ── Header ── */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
              BB&nbsp;#{record.maViPham}
            </span>
            <span style={{ padding: '1px 8px', borderRadius: 9, fontSize: 11, fontWeight: 600, background: status.bg, color: status.fg }}>
              {status.label}
            </span>
            {hasChanges && <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>● chưa lưu</span>}
            {savedFlash  && <span style={{ fontSize: 11, color: '#057a55', fontWeight: 600 }}>✓ Đã lưu</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{position}&nbsp;/&nbsp;{total}</span>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* ── Nav bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 18px', borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb', flexShrink: 0,
        }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(onPrev)} disabled={currentIdx === 0} title="Phím ←">
            ← Trước
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(onNext)} disabled={currentIdx === total - 1} title="Phím →">
            Tiếp →
          </button>
          <button
            className="btn btn-sm"
            style={{
              background: hasMoreUnreviewed ? '#fef3c7' : '#f3f4f6',
              color:       hasMoreUnreviewed ? '#92400e' : '#9ca3af',
              border:      `1px solid ${hasMoreUnreviewed ? '#fbbf24' : '#e5e7eb'}`,
            }}
            onClick={() => navigate(onNextUnreviewed)}
            disabled={!hasMoreUnreviewed}
          >
            ⚡ Chưa duyệt tiếp
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>← → phím điều hướng</span>
        </div>

        {/* ── Body (scrolls internally) ── */}
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* ── Row 1: Nhân viên ── */}
            <div style={S.card}>
              <div style={S.sectionLabel}>
                <div style={S.divLine('#1a56db')} />
                Nhân viên
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                {/* Name + title + dept */}
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                    {record.tenNV || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                    {[record.chucDanh, record.phongBan].filter(Boolean).join('  ·  ') || '—'}
                  </div>
                </div>
                {/* Identifiers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '4px 16px', flexShrink: 0 }}>
                  <KV label="Mã vi phạm"   value={record.maViPham}  mono />
                  <KV label="Mã vụ việc"   value={record.maVuViec}  mono />
                  <KV label="Mã nhân viên" value={record.maNV}      mono />
                </div>
              </div>
            </div>

            {/* ── Row 2: Vi phạm — 2 cột ── */}
            <div>
              <div style={S.sectionLabel}>
                <div style={S.divLine('#2563eb')} />
                Nội dung vi phạm
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 8 }}>
                {/* Cột trái: nội dung + thời điểm */}
                <div>
                  <VBlock label="Nội dung vi phạm"   value={record.noiDung}           borderColor="#2563eb" bg="#eff6ff" />
                  <VBlock label="Thời điểm vi phạm"  value={fmtDate(record.thoiDiemVP)} borderColor="#7c3aed" bg="#f5f3ff" />
                </div>
                {/* Cột phải: lỗi + hình thức */}
                <div>
                  <VBlock label="Lỗi vi phạm"       value={record.loiViPham}          borderColor="#d97706" bg="#fffbeb" />
                  <VBlock label="Hình thức xử lý"   value={record.hinhThuc}            borderColor="#059669" bg="#ecfdf5" />
                </div>
              </div>
            </div>

            {/* ── Row 3: Xử lý (horizontal strip) ── */}
            <div style={{ ...S.card, display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '0 20px', alignItems: 'center' }}>
              {/* Tiền phạt — prominent */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>
                  Số tiền phạt
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: record.soTienPhat ? '#dc2626' : '#d1d5db', lineHeight: 1 }}>
                  {fmtMoney(record.soTienPhat) || '—'}
                </div>
              </div>
              <KV label="Ngày duyệt"            value={fmtDate(record.ngayDuyet)} />
              <KV label="Đơn vị phát sinh BBVP" value={record.donViPhatSinh} />
            </div>

            {/* ── Divider ── */}
            <div style={{ height: 1, background: '#e5e7eb' }} />

            {/* ── Row 4: Phê duyệt ── */}
            <div>
              <div style={S.sectionLabel}>
                <div style={S.divLine('#374151')} />
                Kết quả phê duyệt
              </div>

              <div className="radio-group">
                <label className="radio-option approve" style={{ padding: '10px 18px', fontSize: 14 }}>
                  <input type="radio" name="ketQua" value="Đồng ý"
                    checked={ketQua === 'Đồng ý'}
                    onChange={() => { setKetQua('Đồng ý'); setNguyenNhan(''); setChiTiet(''); setHasChanges(true); setError(''); }} />
                  <span>✓ Đồng ý</span>
                </label>
                <label className="radio-option reject" style={{ padding: '10px 18px', fontSize: 14 }}>
                  <input type="radio" name="ketQua" value="Không đồng ý"
                    checked={ketQua === 'Không đồng ý'}
                    onChange={() => { setKetQua('Không đồng ý'); setHasChanges(true); setError(''); }} />
                  <span>✗ Không đồng ý</span>
                </label>
              </div>

              {ketQua === 'Không đồng ý' && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>
                      Nguyên nhân không phê duyệt
                      <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}>(cột AJ)</span>
                    </label>
                    <select className="form-control" style={{ fontSize: 13 }} value={nguyenNhan}
                      onChange={e => { setNguyenNhan(e.target.value); setHasChanges(true); }}>
                      <option value="">-- Chọn nguyên nhân --</option>
                      {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>
                      Chi tiết / Nội dung chỉnh sửa
                      <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}>(cột AK)</span>
                    </label>
                    <textarea className="form-control" style={{ fontSize: 13 }} rows={3} value={chiTiet}
                      onChange={e => { setChiTiet(e.target.value); setHasChanges(true); }}
                      placeholder="Nhập chi tiết nguyên nhân hoặc nội dung vi phạm cần chỉnh sửa..." />
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-error" style={{ marginTop: 8, marginBottom: 0, fontSize: 12, padding: '7px 12px' }}>
                  {error}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 'auto' }}>
            Lưu cục bộ → dùng "Đồng bộ phê duyệt" để ghi lên sheet
          </span>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Đóng</button>
          <button
            className={`btn btn-sm ${ketQua === 'Đồng ý' ? 'btn-success' : ketQua === 'Không đồng ý' ? 'btn-danger' : 'btn-primary'}`}
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

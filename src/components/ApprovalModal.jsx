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

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--gray-500)',
      textTransform: 'uppercase', letterSpacing: '.06em',
      marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 3, height: 12, background: 'var(--primary)', borderRadius: 2 }} />
      {children}
    </div>
  );
}

function KV({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, color: highlight ? 'var(--gray-900)' : 'var(--gray-700)',
        fontWeight: highlight ? 600 : 400,
      }}>
        {value || '—'}
      </div>
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
  const [error, setError]           = useState('');

  // Load form state when record changes (via navigation)
  useEffect(() => {
    if (!record) return;
    setKetQua(record.ketQua || '');
    setNguyenNhan(record.nguyenNhan || '');
    setChiTiet(record.chiTiet || '');
    setHasChanges(false);
    setError('');
  }, [currentIdx]);

  // ── Form handlers ──────────────────────────────────────
  const changeKetQua = (val) => {
    setKetQua(val);
    if (val === 'Đồng ý') { setNguyenNhan(''); setChiTiet(''); }
    setHasChanges(true);
    setError('');
  };

  // ── Save locally ───────────────────────────────────────
  const handleSave = () => {
    if (!ketQua) { setError('Vui lòng chọn kết quả phê duyệt'); return; }
    if (ketQua === 'Không đồng ý' && !nguyenNhan) {
      setError('Vui lòng chọn nguyên nhân'); return;
    }
    doSave();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const doSave = () => {
    onSaveLocal(
      record._rowIndex, ketQua,
      ketQua === 'Đồng ý' ? '' : nguyenNhan,
      ketQua === 'Đồng ý' ? '' : chiTiet,
    );
    setHasChanges(false);
    setError('');
  };

  // ── Auto-save then navigate ────────────────────────────
  const navigate = (navFn) => {
    if (hasChanges && ketQua) doSave();
    navFn();
  };

  // ── Keyboard navigation (← →) ─────────────────────────
  // Use ref to always access fresh navigate/onClose without re-binding
  const handleNavRef = useRef({});
  handleNavRef.current = {
    prev:          () => navigate(onPrev),
    next:          () => navigate(onNext),
    nextUnreviewed:() => navigate(onNextUnreviewed),
    close:         onClose,
  };

  useEffect(() => {
    const onKey = (e) => {
      // Don't intercept when user is typing
      const tag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.key === 'ArrowLeft')  { e.preventDefault(); handleNavRef.current.prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNavRef.current.next(); }
      if (e.key === 'Escape')     handleNavRef.current.close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!record) return null;

  const total    = records.length;
  const position = currentIdx + 1;
  const fmtMoney = (v) =>
    v && !isNaN(Number(v)) ? Number(v).toLocaleString('vi-VN') + ' đ' : (v || '—');

  const statusColor =
    !record.ketQua            ? { bg: '#fef3c7', color: '#92400e', text: 'Chưa xử lý' } :
    record.ketQua === 'Đồng ý' ? { bg: '#def7ec', color: '#057a55', text: 'Đồng ý'     } :
                                 { bg: '#fde8e8', color: '#c81e1e', text: 'Không đồng ý'};

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 720 }}>

        {/* ── Header ── */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>
                  BB #{record.maViPham}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: statusColor.bg, color: statusColor.color,
                }}>
                  {statusColor.text}
                </span>
                {hasChanges && (
                  <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>● chưa lưu</span>
                )}
                {savedFlash && (
                  <span style={{ fontSize: 11, color: '#057a55', fontWeight: 600 }}>✓ Đã lưu</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                {position} / {total} biên bản
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* ── Navigation bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 20px', borderBottom: '1px solid var(--gray-200)',
          background: 'var(--gray-50)',
        }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate(onPrev)}
            disabled={currentIdx === 0}
            title="Phím ←"
          >
            ← Trước
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate(onNext)}
            disabled={currentIdx === total - 1}
            title="Phím →"
          >
            Tiếp →
          </button>
          <button
            className="btn btn-sm"
            style={{
              background: hasMoreUnreviewed ? '#fef3c7' : 'var(--gray-100)',
              color:       hasMoreUnreviewed ? '#92400e' : 'var(--gray-400)',
              border:      `1px solid ${hasMoreUnreviewed ? '#fbbf24' : 'var(--gray-200)'}`,
            }}
            onClick={() => navigate(onNextUnreviewed)}
            disabled={!hasMoreUnreviewed}
            title="Nhảy đến biên bản chưa phê duyệt tiếp theo"
          >
            ⚡ Chưa duyệt tiếp
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gray-400)' }}>
            ← → phím điều hướng
          </span>
        </div>

        {/* ── Body ── */}
        <div className="modal-body" style={{ padding: '20px 24px' }}>

          {/* Section 1 — Nhân viên */}
          <div className="modal-section">
            <SectionTitle>Nhân viên</SectionTitle>
            <div style={{
              background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
              borderRadius: 8, padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>
                    {record.tenNV || '—'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                    {record.chucDanh || ''}
                  </div>
                </div>
                {record.soTienPhat && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>TIỀN PHẠT</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#c81e1e' }}>
                      {fmtMoney(record.soTienPhat)}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 12px' }}>
                <KV label="Mã vi phạm"  value={record.maViPham} highlight />
                <KV label="Mã vụ việc"  value={record.maVuViec} />
                <KV label="Mã nhân viên" value={record.maNV} />
                <KV label="Ngày lập"    value={record.ngayLap} />
              </div>
            </div>
          </div>

          {/* Section 2 — Nội dung vi phạm */}
          <div className="modal-section">
            <SectionTitle>Nội dung vi phạm</SectionTitle>
            <div style={{
              borderLeft: '3px solid var(--primary)', background: '#f0f5ff',
              borderRadius: '0 8px 8px 0', padding: '12px 16px',
            }}>
              <div style={{ fontSize: 14, color: 'var(--gray-900)', lineHeight: 1.65, fontWeight: 500 }}>
                {record.noiDung || '—'}
              </div>
            </div>

            {record.loiViPham && (
              <div style={{
                marginTop: 8, padding: '10px 14px',
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
                  Lỗi vi phạm
                </div>
                <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
                  {record.loiViPham}
                </div>
              </div>
            )}

            {record.hinhThuc && (
              <div style={{
                marginTop: 8, padding: '10px 14px',
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 11, color: '#065f46', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
                  Hình thức xử lý
                </div>
                <div style={{ fontSize: 13, color: '#064e3b', lineHeight: 1.5 }}>
                  {record.hinhThuc}
                </div>
              </div>
            )}
          </div>

          {/* Section 3 — Metadata */}
          <div className="modal-section">
            <SectionTitle>Thông tin xử lý</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px' }}>
              <KV label="Người lập BBVP" value={record.nguoiLap} />
              <KV label="Bộ phận lập"    value={record.nguoiLap && record.phongBan ? record.phongBan : null} />
              <KV label="Bồi thường"     value={record.boiThuong ? fmtMoney(record.boiThuong) : null} />
            </div>
          </div>

          <div className="divider" />

          {/* Section 4 — Phê duyệt */}
          <div className="modal-section" style={{ marginBottom: 0 }}>
            <SectionTitle>Kết quả phê duyệt</SectionTitle>
            <div className="radio-group" style={{ marginBottom: ketQua === 'Không đồng ý' ? 16 : 0 }}>
              <label className="radio-option approve" style={{ fontSize: 15, padding: '12px 20px' }}>
                <input
                  type="radio" name="ketQua" value="Đồng ý"
                  checked={ketQua === 'Đồng ý'}
                  onChange={() => changeKetQua('Đồng ý')}
                />
                <span>✓ Đồng ý</span>
              </label>
              <label className="radio-option reject" style={{ fontSize: 15, padding: '12px 20px' }}>
                <input
                  type="radio" name="ketQua" value="Không đồng ý"
                  checked={ketQua === 'Không đồng ý'}
                  onChange={() => changeKetQua('Không đồng ý')}
                />
                <span>✗ Không đồng ý</span>
              </label>
            </div>

            {ketQua === 'Không đồng ý' && (
              <div style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">
                    Nguyên nhân không phê duyệt
                    <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 4 }}>(cột AJ)</span>
                  </label>
                  <select
                    className="form-control"
                    value={nguyenNhan}
                    onChange={e => { setNguyenNhan(e.target.value); setHasChanges(true); }}
                  >
                    <option value="">-- Chọn nguyên nhân --</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Chi tiết / Nội dung chỉnh sửa
                    <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 4 }}>(cột AK)</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={chiTiet}
                    onChange={e => { setChiTiet(e.target.value); setHasChanges(true); }}
                    placeholder="Nhập chi tiết nguyên nhân hoặc nội dung vi phạm cần chỉnh sửa..."
                  />
                </div>
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <span style={{ fontSize: 12, color: 'var(--gray-400)', marginRight: 'auto' }}>
            Lưu cục bộ → bấm "Đồng bộ phê duyệt" để ghi lên sheet
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

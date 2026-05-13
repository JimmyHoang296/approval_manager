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

function SectionTitle({ children, color = 'var(--primary)' }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--gray-500)',
      textTransform: 'uppercase', letterSpacing: '.07em',
      marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 3, height: 11, background: color, borderRadius: 2, flexShrink: 0 }} />
      {children}
    </div>
  );
}

// A single label + value pair
function Field({ label, value, span = 1, large, mono }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{
        fontSize: large ? 14 : 13,
        fontWeight: large ? 600 : 400,
        color: 'var(--gray-800)',
        fontFamily: mono ? 'monospace' : undefined,
        lineHeight: 1.5,
      }}>
        {value || '—'}
      </div>
    </div>
  );
}

// Highlighted text block (violation content, lỗi, hình thức)
function HighlightBlock({ label, value, accentColor, bgColor }) {
  if (!value) return null;
  return (
    <div style={{
      borderLeft: `3px solid ${accentColor}`,
      background: bgColor,
      borderRadius: '0 6px 6px 0',
      padding: '10px 14px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.65 }}>
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

  const changeKetQua = (val) => {
    setKetQua(val);
    if (val === 'Đồng ý') { setNguyenNhan(''); setChiTiet(''); }
    setHasChanges(true);
    setError('');
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

  // Keyboard navigation ← →
  const navRef = useRef({});
  navRef.current = {
    prev: () => navigate(onPrev),
    next: () => navigate(onNext),
    close: onClose,
  };
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
    if (!v) return '—';
    if (v instanceof Date) return v.toLocaleDateString('vi-VN');
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleDateString('vi-VN');
  };
  const fmtMoney = (v) =>
    v && !isNaN(Number(v)) ? Number(v).toLocaleString('vi-VN') + ' đ' : (v || '—');

  const statusBadge =
    !record.ketQua             ? { bg: '#fef3c7', fg: '#92400e', label: 'Chưa xử lý' } :
    record.ketQua === 'Đồng ý' ? { bg: '#def7ec', fg: '#057a55', label: 'Đồng ý'     } :
                                  { bg: '#fde8e8', fg: '#c81e1e', label: 'Không đồng ý'};

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 740 }}>

        {/* ── Header ── */}
        <div className="modal-header" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>
              BB #{record.maViPham}
            </span>
            <span style={{
              padding: '2px 9px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: statusBadge.bg, color: statusBadge.fg,
            }}>
              {statusBadge.label}
            </span>
            {hasChanges && <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>● chưa lưu</span>}
            {savedFlash  && <span style={{ fontSize: 11, color: '#057a55', fontWeight: 600 }}>✓ Đã lưu</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{position} / {total}</span>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* ── Navigation bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 20px', borderBottom: '1px solid var(--gray-200)',
          background: 'var(--gray-50)',
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
              background: hasMoreUnreviewed ? '#fef3c7' : 'var(--gray-100)',
              color:       hasMoreUnreviewed ? '#92400e' : 'var(--gray-400)',
              border:      `1px solid ${hasMoreUnreviewed ? '#fbbf24' : 'var(--gray-200)'}`,
            }}
            onClick={() => navigate(onNextUnreviewed)}
            disabled={!hasMoreUnreviewed}
          >
            ⚡ Chưa duyệt tiếp
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gray-400)' }}>← → phím điều hướng</span>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Block 1 — Nhân viên */}
          <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '14px 16px' }}>
            <SectionTitle>Nhân viên</SectionTitle>
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.3 }}>
                  {record.tenNV || '—'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 3 }}>
                  {[record.chucDanh, record.phongBan].filter(Boolean).join('  ·  ')}
                </div>
              </div>
            </div>
            {/* Identifiers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px' }}>
              <Field label="Mã vi phạm"   value={record.maViPham}  large mono />
              <Field label="Mã vụ việc"   value={record.maVuViec}  mono />
              <Field label="Mã nhân viên" value={record.maNV}      mono />
            </div>
          </div>

          {/* Block 2 — Nội dung vi phạm */}
          <div>
            <SectionTitle color="#2563eb">Nội dung vi phạm</SectionTitle>
            <HighlightBlock
              label="Nội dung vi phạm"
              value={record.noiDung}
              accentColor="#2563eb"
              bgColor="#eff6ff"
            />
            <HighlightBlock
              label="Thời điểm vi phạm"
              value={fmtDate(record.thoiDiemVP)}
              accentColor="#6366f1"
              bgColor="#eef2ff"
            />
            <HighlightBlock
              label="Lỗi vi phạm"
              value={record.loiViPham}
              accentColor="#d97706"
              bgColor="#fffbeb"
            />
            <HighlightBlock
              label="Hình thức xử lý"
              value={record.hinhThuc}
              accentColor="#059669"
              bgColor="#ecfdf5"
            />
          </div>

          {/* Block 3 — Xử lý tài chính & hành chính */}
          <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '14px 16px' }}>
            <SectionTitle color="#dc2626">Xử lý</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 20px' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500, marginBottom: 3 }}>Số tiền phạt</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: record.soTienPhat ? '#dc2626' : 'var(--gray-400)' }}>
                  {record.soTienPhat ? fmtMoney(record.soTienPhat) : '—'}
                </div>
              </div>
              <Field label="Ngày duyệt"            value={fmtDate(record.ngayDuyet)} />
              <Field label="Đơn vị phát sinh BBVP" value={record.donViPhatSinh} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--gray-200)' }} />

          {/* Block 4 — Phê duyệt */}
          <div>
            <SectionTitle>Kết quả phê duyệt</SectionTitle>
            <div className="radio-group" style={{ marginBottom: 0 }}>
              <label className="radio-option approve" style={{ padding: '12px 20px', fontSize: 15 }}>
                <input type="radio" name="ketQua" value="Đồng ý"
                  checked={ketQua === 'Đồng ý'} onChange={() => changeKetQua('Đồng ý')} />
                <span>✓ Đồng ý</span>
              </label>
              <label className="radio-option reject" style={{ padding: '12px 20px', fontSize: 15 }}>
                <input type="radio" name="ketQua" value="Không đồng ý"
                  checked={ketQua === 'Không đồng ý'} onChange={() => changeKetQua('Không đồng ý')} />
                <span>✗ Không đồng ý</span>
              </label>
            </div>

            {ketQua === 'Không đồng ý' && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Nguyên nhân không phê duyệt
                    <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 4, fontSize: 12 }}>(cột AJ)</span>
                  </label>
                  <select className="form-control" value={nguyenNhan}
                    onChange={e => { setNguyenNhan(e.target.value); setHasChanges(true); }}>
                    <option value="">-- Chọn nguyên nhân --</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Chi tiết / Nội dung chỉnh sửa
                    <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 4, fontSize: 12 }}>(cột AK)</span>
                  </label>
                  <textarea className="form-control" rows={3} value={chiTiet}
                    onChange={e => { setChiTiet(e.target.value); setHasChanges(true); }}
                    placeholder="Nhập chi tiết nguyên nhân hoặc nội dung vi phạm cần chỉnh sửa..." />
                </div>
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>{error}</div>}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <span style={{ fontSize: 12, color: 'var(--gray-400)', marginRight: 'auto' }}>
            Lưu cục bộ → dùng "Đồng bộ phê duyệt" để ghi lên sheet
          </span>
          <button className="btn btn-outline" onClick={onClose}>Đóng</button>
          <button
            className={`btn ${ketQua === 'Đồng ý' ? 'btn-success' : ketQua === 'Không đồng ý' ? 'btn-danger' : 'btn-primary'}`}
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

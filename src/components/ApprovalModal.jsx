import { useState } from 'react';
import { submitApproval } from '../services/api';

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

export default function ApprovalModal({ record, onClose, onSaved }) {
  const [ketQua, setKetQua] = useState(record.ketQua || '');
  const [nguyenNhan, setNguyenNhan] = useState(record.nguyenNhan || '');
  const [chiTiet, setChiTiet] = useState(record.chiTiet || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!ketQua) {
      setError('Vui lòng chọn kết quả phê duyệt');
      return;
    }
    if (ketQua === 'Không đồng ý' && !nguyenNhan) {
      setError('Vui lòng chọn nguyên nhân không đồng ý');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await submitApproval(
        record._rowIndex,
        ketQua,
        ketQua === 'Đồng ý' ? '' : nguyenNhan,
        ketQua === 'Đồng ý' ? '' : chiTiet
      );
      if (res.success) {
        onSaved(
          record._rowIndex,
          ketQua,
          ketQua === 'Đồng ý' ? '' : nguyenNhan,
          ketQua === 'Đồng ý' ? '' : chiTiet
        );
      } else {
        setError(res.message || 'Lỗi khi lưu');
      }
    } catch {
      setError('Không thể kết nối server');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v) => {
    if (!v) return '—';
    if (typeof v === 'number') return v.toLocaleString('vi-VN') + ' đ';
    return String(v);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Phê duyệt Vi phạm #{record.maViPham}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Record info */}
          <div className="info-grid">
            <InfoItem label="Mã vi phạm" value={record.maViPham} />
            <InfoItem label="Mã vụ việc" value={record.maVuViec} />
            <InfoItem label="Mã nhân viên" value={record.maNV} />
            <InfoItem label="Tên nhân viên" value={record.tenNV} />
            <InfoItem label="Chức danh" value={record.chucDanh} />
            <InfoItem label="Ngày lập BBVP" value={record.ngayLap} />
            <InfoItem label="Người lập" value={record.nguoiLap} />
            <InfoItem label="Số tiền phạt" value={record.soTienPhat ? fmt(record.soTienPhat) : null} />
          </div>

          <div className="info-item" style={{ marginBottom: 12 }}>
            <div className="info-label">Nội dung vi phạm</div>
            <div className="info-value" style={{ fontSize: 13, lineHeight: 1.6 }}>{record.noiDung || '—'}</div>
          </div>

          <div className="info-item" style={{ marginBottom: 12 }}>
            <div className="info-label">Hình thức xử lý</div>
            <div className="info-value" style={{ fontSize: 13, lineHeight: 1.6 }}>{record.hinhThuc || '—'}</div>
          </div>

          <div className="info-item" style={{ marginBottom: 12 }}>
            <div className="info-label">Lỗi vi phạm</div>
            <div className="info-value" style={{ fontSize: 13, lineHeight: 1.6 }}>{record.loiViPham || '—'}</div>
          </div>

          <div className="divider" />

          {/* Approval decision */}
          <div className="form-group">
            <label className="form-label">Kết quả phê duyệt (cột AI)</label>
            <div className="radio-group">
              <label className={`radio-option approve`}>
                <input
                  type="radio"
                  name="ketQua"
                  value="Đồng ý"
                  checked={ketQua === 'Đồng ý'}
                  onChange={() => { setKetQua('Đồng ý'); setNguyenNhan(''); setChiTiet(''); }}
                />
                <span>✓ Đồng ý</span>
              </label>
              <label className={`radio-option reject`}>
                <input
                  type="radio"
                  name="ketQua"
                  value="Không đồng ý"
                  checked={ketQua === 'Không đồng ý'}
                  onChange={() => setKetQua('Không đồng ý')}
                />
                <span>✗ Không đồng ý</span>
              </label>
            </div>
          </div>

          {ketQua === 'Không đồng ý' && (
            <>
              <div className="form-group">
                <label className="form-label">Nguyên nhân không phê duyệt (cột AJ)</label>
                <select
                  className="form-control"
                  value={nguyenNhan}
                  onChange={e => setNguyenNhan(e.target.value)}
                >
                  <option value="">-- Chọn nguyên nhân --</option>
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Chi tiết nguyên nhân / Nội dung chỉnh sửa (cột AK)
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={chiTiet}
                  onChange={e => setChiTiet(e.target.value)}
                  placeholder="Nhập chi tiết nguyên nhân hoặc nội dung vi phạm cần chỉnh sửa..."
                />
              </div>
            </>
          )}

          {error && <div className="alert alert-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Hủy</button>
          <button
            className={`btn ${ketQua === 'Đồng ý' ? 'btn-success' : ketQua === 'Không đồng ý' ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleSave}
            disabled={saving || !ketQua}
          >
            {saving ? 'Đang lưu...' : 'Lưu phê duyệt'}
          </button>
        </div>
      </div>
    </div>
  );
}

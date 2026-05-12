import { useState, useEffect } from 'react';
import { getDashboard } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function StatCard({ label, value, type }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getDashboard()
      .then(res => {
        if (res.success) setData(res.data);
        else setError('Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Đang tải dữ liệu...</span>
    </div>
  );

  if (error) return <div className="alert alert-error">{error}</div>;

  const { summary, byAssignee } = data;

  const filtered = byAssignee
    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.chuaXuLy - a.chuaXuLy);

  const pct = (v, t) => t > 0 ? Math.round(v / t * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Thống kê phê duyệt vi phạm</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Tổng vi phạm" value={summary.total} type="total" />
        <StatCard label="Đã đồng ý" value={summary.dongY} type="approved" />
        <StatCard label="Không đồng ý" value={summary.khongDongY} type="rejected" />
        <StatCard label="Chưa xử lý" value={summary.chuaXuLy} type="pending" />
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>Chi tiết theo thanh tra</h2>
          <input
            className="search-input"
            type="text"
            placeholder="Tìm tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Thanh tra phụ trách</th>
                  <th style={{ textAlign: 'center' }}>Tổng</th>
                  <th style={{ textAlign: 'center' }}>Đồng ý</th>
                  <th style={{ textAlign: 'center' }}>Không đồng ý</th>
                  <th style={{ textAlign: 'center' }}>Chưa xử lý</th>
                  <th>Tiến độ</th>
                  <th style={{ textAlign: 'center' }}>% Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">Không có dữ liệu</div>
                    </td>
                  </tr>
                ) : filtered.map(item => {
                  const done = item.dongY + item.khongDongY;
                  const pctDone = pct(done, item.total);
                  return (
                    <tr key={item.name}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.total}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success">{item.dongY}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-danger">{item.khongDongY}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {item.chuaXuLy > 0
                          ? <span className="badge badge-warning">{item.chuaXuLy}</span>
                          : <span className="badge badge-gray">0</span>
                        }
                      </td>
                      <td>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: pctDone + '%' }} />
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>
                        {pctDone}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

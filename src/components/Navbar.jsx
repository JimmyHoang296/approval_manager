import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = { emp: 'Thanh tra', hod: 'Trưởng nhóm', director: 'Giám đốc' };

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <a href="/dashboard" className="navbar-brand">📋 Phê duyệt Vi phạm</a>

      <div className="navbar-menu">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/approval"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Phê duyệt
        </NavLink>
      </div>

      {user && (
        <div className="nav-user">
          <span>
            <strong>{user.name}</strong>
            {' · '}
            <span style={{ fontSize: 12, opacity: .8 }}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </span>
          <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
        </div>
      )}
    </nav>
  );
}

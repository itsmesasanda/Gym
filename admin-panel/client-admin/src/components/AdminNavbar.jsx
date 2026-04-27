import React from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

const AdminNavbar = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.brandName}>OXY GYM</span>
      </div>
      <div style={styles.right}>
        {admin && (
          <>
            <span style={styles.adminEmail}>{admin.email}</span>
            <span style={styles.badge}>{admin.role}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '64px',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { 
    fontSize: '24px', 
    background: 'var(--accent-primary)', 
    width: '36px', 
    height: '36px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: '10px',
    color: '#000'
  },
  brandName: { 
    fontSize: '20px', 
    fontWeight: '800', 
    color: 'var(--text-primary)', 
    letterSpacing: '-0.02em' 
  },
  right: { display: 'flex', alignItems: 'center', gap: '20px' },
  adminEmail: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' },
  badge: {
    background: 'var(--accent-primary-alpha)',
    color: 'var(--accent-primary)',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid rgba(208, 253, 62, 0.2)'
  },
  logoutBtn: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid rgba(255, 69, 58, 0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
};

export default AdminNavbar;

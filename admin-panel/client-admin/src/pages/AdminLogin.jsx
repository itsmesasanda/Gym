import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const API_URL = 'http://localhost:5001/api';

const AdminLogin = () => {
  const { login } = useAdminAuth();
  const navigate   = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server is not responding. Make sure backend is running on port 5000.');
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      login(data.token, data.admin);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.logoRow}>
          <h1 style={styles.title}>OXY GYM</h1>
        </div>
        <p style={styles.sub}>Sign in to your admin account</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          id="admin-email"
          style={styles.input}
          type="email"
          name="email"
          placeholder="admin@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label style={styles.label}>Password</label>
        <input
          id="admin-password"
          style={styles.input}
          type="password"
          name="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button id="login-btn" style={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  page: { 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: 'var(--bg-primary)',
    padding: '20px'
  },
  card: { 
    background: 'var(--bg-secondary)', 
    borderRadius: 'var(--radius-xl)', 
    padding: '48px 40px', 
    width: '100%', 
    maxWidth: '420px', 
    boxShadow: 'var(--shadow-md)', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px', justifyContent: 'center' },
  title: { fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' },
  sub: { color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 12px', textAlign: 'center', fontWeight: '500' },
  error: { background: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', border: '1px solid rgba(255, 69, 58, 0.2)' },
  label: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '-12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { 
    background: 'var(--bg-tertiary)', 
    border: '1px solid rgba(255, 255, 255, 0.08)', 
    borderRadius: 'var(--radius-md)', 
    padding: '14px 16px', 
    color: 'var(--text-primary)', 
    fontSize: '15px', 
    outline: 'none',
    transition: 'var(--transition)'
  },
  btn: { 
    marginTop: '12px', 
    background: 'var(--accent-primary)', 
    color: '#000', 
    border: 'none', 
    borderRadius: 'var(--radius-md)', 
    padding: '16px', 
    fontSize: '16px', 
    fontWeight: '700', 
    cursor: 'pointer', 
    letterSpacing: '0.02em',
    transition: 'var(--transition)',
  },
};

export default AdminLogin;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { userApi } from '../services/userApi';

const UserLogin = () => {
  const { login } = useUserAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setForm((p) => ({ ...p, phone: value.replace(/\D/g, '').slice(0, 10) }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.phone.length !== 10) {
      setError('Phone must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      const data = await userApi.login(form.email, form.phone);
      login(data.token, data.user);
      navigate('/user', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>OXY GYM</h1>
        <p style={styles.sub}>Member Login</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="member@email.com"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label style={styles.label}>Phone Number</label>
        <input
          style={styles.input}
          type="text"
          name="phone"
          placeholder="10-digit phone number"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <small style={styles.counter}>{form.phone.length}/10</small>

        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
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
    padding: '20px',
  },
  card: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    padding: '42px 36px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.02em',
    textAlign: 'center',
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '15px',
    margin: '0 0 6px',
    textAlign: 'center',
    fontWeight: '500',
  },
  error: {
    background: 'rgba(255, 69, 58, 0.1)',
    color: 'var(--danger)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    border: '1px solid rgba(255, 69, 58, 0.2)',
  },
  label: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    background: 'var(--bg-tertiary)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
  },
  counter: {
    color: 'var(--text-secondary)',
    fontSize: '12px',
    marginTop: '-6px',
  },
  btn: {
    marginTop: '8px',
    background: 'var(--accent-primary)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default UserLogin;

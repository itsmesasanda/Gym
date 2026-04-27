import React, { useEffect, useState } from 'react';
import { ADMIN_API_URL } from '../config/api';

const API_URL = ADMIN_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const ManageAdmins = () => {
  const [admins, setAdmins]     = useState([]);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('admin');
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const flash = (text, isErr = false) => {
    isErr ? setError(text) : setMsg(text);
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  const loadAdmins = async () => {
    try {
      const r = await fetch(`${API_URL}/auth/admins`, { headers: authHeaders() });
      if (!r.ok) throw new Error('Failed to fetch admins');
      const data = await r.json();
      setAdmins(data);
    } catch (e) {
      console.error('loadAdmins:', e);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      flash('Email and password required', true);
      return;
    }
    if (password.length < 6) {
      flash('Password must be at least 6 characters', true);
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email, password, role }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to create admin');

      flash(`Admin "${email}" created successfully`);
      setEmail('');
      setPassword('');
      setRole('admin');
      loadAdmins();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, adminEmail) => {
    if (!window.confirm(`Delete admin "${adminEmail}"? This cannot be undone.`)) return;
    try {
      const r = await fetch(`${API_URL}/auth/admins/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || 'Failed to delete admin');
      }
      flash(`Admin "${adminEmail}" deleted`);
      loadAdmins();
    } catch (err) {
      flash(err.message, true);
    }
  };

  return (
    <div>
      <h2 style={s.heading}>Manage Admins</h2>

      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}

      {/* Create new admin form */}
      <form onSubmit={handleSubmit} style={s.form}>
        <h3 style={s.formTitle}>Create New Admin</h3>
        <div style={s.grid}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="newadmin@gym.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Role</label>
            <select
              style={s.input}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>
        <div style={s.btnRow}>
          <button style={s.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Admin'}
          </button>
        </div>
      </form>

      {/* Existing admins table */}
      <div style={s.tableCard}>
        <div style={s.wrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Email', 'Role', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan={4} style={s.empty}>No admins found.</td></tr>
              ) : (
                admins.map((a) => (
                  <tr key={a._id} style={s.row}>
                    <td style={s.td}>{a.email}</td>
                    <td style={s.td}>
                      <span style={s.roleBadge}>{a.role}</span>
                    </td>
                    <td style={s.td}>
                      {new Date(a.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td style={s.td}>
                      <button
                        style={s.delBtn}
                        onClick={() => handleDelete(a._id, a.email)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Default credentials info */}
      <div style={s.infoBox}>
        <strong>Default Admin Credentials:</strong>
        <br />Email: admin@example.com
        <br />Password: admin123
      </div>
    </div>
  );
};

const s = {
  heading: { fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '24px', letterSpacing: '-0.02em' },
  success: { background: 'rgba(50, 215, 75, 0.1)', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', border: '1px solid rgba(50, 215, 75, 0.2)', marginBottom: '16px' },
  error:   { background: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', border: '1px solid rgba(255, 69, 58, 0.2)', marginBottom: '16px' },
  form: { background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '32px', marginBottom: '32px', border: '1px solid rgba(255, 255, 255, 0.05)' },
  formTitle: { color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginTop: 0, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' },
  input: { background: 'var(--bg-tertiary)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' },
  btnRow: { display: 'flex', gap: '12px', marginTop: '24px' },
  submitBtn: { background: 'var(--accent-primary)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },

  tableCard: { background: 'transparent', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  wrapper: { overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '8px' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0' },
  th: { textAlign: 'left', padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' },
  td: { padding: '16px 20px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' },
  row: { transition: 'var(--transition)' },
  empty: { textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)', fontSize: '15px' },
  roleBadge: { background: 'var(--accent-primary-alpha)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(208, 253, 62, 0.2)' },
  delBtn: { color: 'var(--danger)', border: '1px solid rgba(255, 69, 58, 0.2)', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },

  infoBox: { marginTop: '24px', background: 'rgba(100, 210, 255, 0.08)', border: '1px solid rgba(100, 210, 255, 0.2)', borderRadius: 'var(--radius-md)', padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.8' },
};

export default ManageAdmins;

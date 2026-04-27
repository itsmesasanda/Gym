import React, { useEffect, useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { userApi } from '../services/userApi';
import { formatCurrencyLKR } from '../utils/adminHelpers';

const UserHome = () => {
  const { user, logout } = useUserAuth();
  const [stats, setStats] = useState({ announcements: 0, events: 0, meals: 0, workouts: 0, videos: 0 });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPortal = async () => {
      setLoading(true);
      setError('');
      try {
        const [announcements, events, meals, workouts, videos, myPayments] = await Promise.all([
          userApi.getAnnouncements(),
          userApi.getEvents(),
          userApi.getMeals(),
          userApi.getWorkouts(),
          userApi.getVideos(),
          userApi.getMyPayments(),
        ]);

        setStats({
          announcements: announcements.length,
          events: events.length,
          meals: meals.length,
          workouts: workouts.length,
          videos: videos.length,
        });
        setPayments(myPayments || []);
      } catch (err) {
        setError(err.message || 'Failed to load user portal');
      } finally {
        setLoading(false);
      }
    };

    loadPortal();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome, {user?.name || 'Member'}</h2>
        <p style={styles.subtitle}>This is your member view.</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.infoGrid}>
          <div style={styles.infoItem}><span style={styles.label}>Email</span><strong>{user?.email || '—'}</strong></div>
          <div style={styles.infoItem}><span style={styles.label}>Phone</span><strong>{user?.phone || '—'}</strong></div>
          <div style={styles.infoItem}><span style={styles.label}>Plan</span><strong>{user?.plan || '—'}</strong></div>
          <div style={styles.infoItem}><span style={styles.label}>Payment Status</span><strong>{user?.paid ? 'Paid' : 'Pending'}</strong></div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}><span style={styles.label}>Announcements</span><strong>{stats.announcements}</strong></div>
          <div style={styles.statCard}><span style={styles.label}>Events</span><strong>{stats.events}</strong></div>
          <div style={styles.statCard}><span style={styles.label}>Meals</span><strong>{stats.meals}</strong></div>
          <div style={styles.statCard}><span style={styles.label}>Workouts</span><strong>{stats.workouts}</strong></div>
          <div style={styles.statCard}><span style={styles.label}>Videos</span><strong>{stats.videos}</strong></div>
        </div>

        <div style={styles.sectionHeader}>Your Payment History</div>
        {loading ? (
          <div style={styles.muted}>Loading your data...</div>
        ) : payments.length === 0 ? (
          <div style={styles.muted}>No payments recorded.</div>
        ) : (
          <div style={styles.paymentList}>
            {payments.slice(0, 5).map((p) => (
              <div key={p._id} style={styles.paymentCard}>
                <div style={styles.paymentTopRow}>
                  <strong>{formatCurrencyLKR(p.amount)}</strong>
                  <span style={styles.paymentStatus}>{p.status}</span>
                </div>
                <div style={styles.mutedSmall}>{p.plan || 'Plan'} · {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</div>
              </div>
            ))}
          </div>
        )}

        <button style={styles.btn} type="button" onClick={logout}>Logout</button>
      </div>
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
    width: 'min(760px, 100%)',
    background: 'var(--bg-secondary)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px',
    boxShadow: 'var(--shadow-sm)',
  },
  title: { margin: 0, marginBottom: '6px', fontSize: '28px' },
  subtitle: { margin: 0, color: 'var(--text-secondary)', marginBottom: '22px' },
  error: {
    marginBottom: '14px',
    background: 'rgba(255, 69, 58, 0.1)',
    color: 'var(--danger)',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(255,69,58,0.2)',
    fontSize: '13px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
    marginBottom: '18px',
  },
  infoItem: {
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '10px',
    marginBottom: '18px',
  },
  statCard: {
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sectionHeader: {
    marginBottom: '10px',
    color: 'var(--text-primary)',
    fontWeight: '700',
  },
  paymentList: {
    display: 'grid',
    gap: '8px',
    marginBottom: '16px',
  },
  paymentCard: {
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  paymentTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '4px',
  },
  paymentStatus: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  muted: {
    color: 'var(--text-secondary)',
    marginBottom: '16px',
  },
  mutedSmall: {
    color: 'var(--text-secondary)',
    fontSize: '12px',
  },
  label: { fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  btn: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid rgba(255,69,58,0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default UserHome;

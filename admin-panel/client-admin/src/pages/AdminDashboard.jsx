import React, { useEffect, useState } from 'react';
import DashboardCards from '../components/DashboardCards';
import { reportService } from '../services/reportService';

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    reportService.getSummary()
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h2 style={styles.heading}>Dashboard Overview</h2>
      {error && <div style={styles.error}>{error}</div>}
      <DashboardCards summary={summary} />
    </div>
  );
};

const styles = {
  heading: { 
    fontSize: '32px', 
    fontWeight: '800', 
    color: 'var(--text-primary)', 
    marginBottom: '32px',
    letterSpacing: '-0.02em'
  },
  error: { background: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '14px', border: '1px solid rgba(255, 69, 58, 0.2)', marginBottom: '24px' },
  infoText: { color: 'var(--text-secondary)', fontSize: '14px', margin: '8px 0', display: 'flex', justifyContent: 'space-between' },
};

export default AdminDashboard;

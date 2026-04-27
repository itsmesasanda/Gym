import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';

const Reports = () => {
  const [summary,    setSummary]    = useState(null);
  const [usersTime,  setUsersTime]  = useState([]);
  const [mealsCal,   setMealsCal]   = useState([]);
  const [error,      setError]      = useState('');

  useEffect(() => {
    Promise.all([
      reportService.getSummary(),
      reportService.getUsersOverTime(),
      reportService.getMealsCalories(),
    ])
      .then(([s, u, m]) => { setSummary(s); setUsersTime(u); setMealsCal(m); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h2 style={s.heading}>Reports & Analytics</h2>
      {error && <div style={s.error}>{error}</div>}

      {/* Summary row */}
      {summary && (
        <div style={s.cardGrid}>
          {[
            ['Total Users',    summary.totalUsers],
            ['Paid Users',     summary.paidUsers],
            ['Total Meals',    summary.totalMeals],
            ['Total Workouts', summary.totalWorkouts],
            ['Total Videos',   summary.totalVideos],
          ].map(([label, val]) => (
            <div key={label} style={s.statCard}>
              <div style={s.statVal}>{val ?? 0}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users over time */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Users Registered Over Time</h3>
        {usersTime.length === 0
          ? <p style={s.empty}>No data yet.</p>
          : (
            <div style={s.barContainer}>
              {usersTime.map((d) => (
                <div key={d.label} style={s.barGroup}>
                  <div style={{ ...s.bar, height: `${Math.min(d.count * 20, 120)}px` }} title={`${d.count} users`} />
                  <div style={s.barLabel}>{d.label}</div>
                  <div style={s.barCount}>{d.count}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Meals calories */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Daily Calorie Totals</h3>
        {mealsCal.length === 0
          ? <p style={s.empty}>No meal data yet.</p>
          : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Total Calories (kcal)</th>
                </tr>
              </thead>
              <tbody>
                {mealsCal.map((m) => (
                  <tr key={m.date}>
                    <td style={s.td}>{m.date || '—'}</td>
                    <td style={s.td}>
                      <span style={s.calBadge}>{m.totalCalories}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
};

const s = {
  heading: { 
    fontSize: '32px', 
    fontWeight: '800', 
    color: 'var(--text-primary)', 
    marginBottom: '32px',
    letterSpacing: '-0.02em'
  },
  error: { background: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '14px', border: '1px solid rgba(255, 69, 58, 0.2)', marginBottom: '24px' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
  statCard: { 
    background: 'var(--bg-secondary)', 
    borderRadius: 'var(--radius-lg)', 
    padding: '24px', 
    textAlign: 'center', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'var(--transition)' 
  },
  statVal: { 
    fontSize: '36px', 
    fontWeight: '800', 
    color: 'var(--accent-primary)',
    letterSpacing: '-0.02em'
  },
  statLabel: { 
    fontSize: '13px', 
    color: 'var(--text-secondary)', 
    marginTop: '8px', 
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  section: { 
    background: 'var(--bg-secondary)', 
    borderRadius: 'var(--radius-lg)', 
    padding: '32px', 
    marginBottom: '32px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: 'var(--shadow-sm)' 
  },
  sectionTitle: { 
    fontSize: '18px', 
    fontWeight: '700', 
    color: 'var(--text-primary)', 
    marginTop: 0, 
    marginBottom: '24px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  empty: { color: 'var(--text-tertiary)', fontSize: '15px', padding: '20px 0' },
  barContainer: { display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '20px 0', minHeight: '180px' },
  barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  bar: { 
    width: '42px', 
    borderRadius: '6px 6px 0 0', 
    minHeight: '4px', 
    transition: 'var(--transition)',
    background: 'var(--accent-primary)',
    boxShadow: '0 4px 12px var(--accent-primary-alpha)'
  },
  barLabel: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' },
  barCount: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: '800' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0' },
  th: { 
    textAlign: 'left', 
    padding: '16px 20px', 
    fontSize: '12px', 
    fontWeight: '700', 
    color: 'var(--text-secondary)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.08em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  td: { 
    padding: '16px 20px', 
    fontSize: '14px', 
    color: 'var(--text-primary)', 
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)' 
  },
  calBadge: { 
    background: 'var(--accent-primary-alpha)', 
    color: 'var(--accent-primary)', 
    padding: '4px 12px', 
    borderRadius: '6px', 
    fontSize: '12px', 
    fontWeight: '700',
    border: '1px solid rgba(208, 253, 62, 0.2)'
  },
};

export default Reports;

import React from 'react';

const Card = ({ title, value, accent }) => (
  <div style={{ ...styles.card, borderLeft: accent ? `3px solid ${accent}` : 'none' }}>
    <div style={styles.content}>
      <div style={styles.value}>{value ?? '0'}</div>
      <div style={styles.title}>{title}</div>
    </div>
  </div>
);

const DashboardCards = ({ summary }) => {
  const cards = [
    { title: 'Total Users',       value: summary?.totalUsers,       accent: '#D0FD3E' },
    { title: 'Paid Users',        value: summary?.paidUsers,        accent: '#32D74B' },
    { title: 'Unpaid Users',      value: summary?.unpaidUsers,      accent: '#FF453A' },
    { title: 'Total Videos',      value: summary?.totalVideos,      accent: '#64D2FF' },
    { title: 'Active This Month', value: summary?.activeThisMonth,  accent: '#BF5AF2' },
    { title: 'AI Plans Generated',value: summary?.totalAIPlans,     accent: '#FF9F0A' },
  ];

  return (
    <div style={styles.grid}>
      {cards.map((c) => (
        <Card key={c.title} {...c} />
      ))}
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  card: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'var(--transition)',
  },
  content: { display: 'flex', flexDirection: 'column', gap: '4px' },
  value: { 
    fontSize: '32px', 
    fontWeight: '800', 
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em'
  },
  title: { 
    fontSize: '14px', 
    color: 'var(--text-secondary)', 
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
};

export default DashboardCards;

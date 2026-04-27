import React from 'react';
import { formatDate } from '../utils/adminHelpers';

const UserTable = ({ users, onEdit, onDelete, onViewHistory }) => (
  <div style={styles.wrapper}>
    <table style={styles.table}>
      <thead>
        <tr>
          {['Name', 'Email', 'Phone', 'Plan', 'Paid', 'Join Date', 'Actions'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td colSpan={7} style={styles.empty}>No users found.</td>
          </tr>
        ) : (
          users.map((u) => (
            <tr key={u._id} style={styles.row}>
              <td style={styles.td}>{u.name}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>{u.phone || '—'}</td>
              <td style={styles.td}>{u.plan}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: u.paid ? '#166534' : '#7f1d1d', color: u.paid ? '#bbf7d0' : '#fecaca' }}>
                  {u.paid ? 'Paid' : 'Unpaid'}
                </span>
              </td>
              <td style={styles.td}>{formatDate(u.joinDate || u.createdAt)}</td>
              <td style={styles.td}>
                <button type="button" style={styles.editBtn} onClick={() => onEdit(u)}>Edit</button>
                {onViewHistory && <button type="button" style={styles.historyBtn} onClick={() => onViewHistory(u)}>History</button>}
                <button type="button" style={styles.delBtn}  onClick={() => onDelete(u._id)}>Delete</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const styles = {
  wrapper: { 
    overflowX: 'auto',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '8px'
  },
  table:   { width: '100%', borderCollapse: 'separate', borderSpacing: '0' },
  th:      { 
    textAlign: 'left', 
    padding: '16px 20px', 
    fontSize: '12px', 
    fontWeight: '700', 
    color: 'var(--text-secondary)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.08em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  td:      { 
    padding: '16px 20px', 
    fontSize: '14px', 
    color: 'var(--text-primary)', 
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)' 
  },
  row:     { transition: 'var(--transition)' },
  empty:   { textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)', fontSize: '15px' },
  badge:   { 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '11px', 
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  editBtn: { 
    marginRight: '8px', 
    color: 'var(--info)', 
    border: '1px solid rgba(100, 210, 255, 0.2)', 
    borderRadius: '6px', 
    padding: '6px 12px', 
    fontSize: '13px', 
    cursor: 'pointer', 
    fontWeight: '600',
    transition: 'var(--transition)'
  },
  historyBtn: {
    marginRight: '8px',
    color: 'var(--accent-primary)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'var(--transition)'
  },
  delBtn:  { 
    color: 'var(--danger)', 
    border: '1px solid rgba(255, 69, 58, 0.2)', 
    borderRadius: '6px', 
    padding: '6px 12px', 
    fontSize: '13px', 
    cursor: 'pointer', 
    fontWeight: '600',
    transition: 'var(--transition)'
  },
};

export default UserTable;

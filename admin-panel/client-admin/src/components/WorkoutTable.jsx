import React from 'react';
import { formatDate } from '../utils/adminHelpers';

const WorkoutTable = ({ workouts, onEdit, onDelete }) => (
  <div style={styles.wrapper}>
    <table style={styles.table}>
      <thead>
        <tr>
          {['Title', 'Date', 'Time', 'Location', 'Description', 'Actions'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {workouts.length === 0 ? (
          <tr><td colSpan={6} style={styles.empty}>No workouts found.</td></tr>
        ) : (
          workouts.map((w) => (
            <tr key={w._id}>
              <td style={styles.td}>{w.title}</td>
              <td style={styles.td}>{formatDate(w.date || w.createdAt)}</td>
              <td style={styles.td}>{w.time || '—'}</td>
              <td style={styles.td}>{w.location || '—'}</td>
              <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.description || '—'}</td>
              <td style={styles.td}>
                <button style={styles.editBtn} onClick={() => onEdit(w)}>Edit</button>
                <button style={styles.delBtn}  onClick={() => onDelete(w._id)}>Delete</button>
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
  empty:   { textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)', fontSize: '15px' },
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

export default WorkoutTable;

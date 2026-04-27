import React from 'react';
import { formatDate } from '../utils/adminHelpers';

const MealTable = ({ meals, onEdit, onDelete }) => (
  <div style={styles.wrapper}>
    <table style={styles.table}>
      <thead>
        <tr>
          {['Name', 'Calories', 'Date', 'Actions'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {meals.length === 0 ? (
          <tr><td colSpan={4} style={styles.empty}>No meals found.</td></tr>
        ) : (
          meals.map((m) => (
            <tr key={m._id} style={styles.row}>
              <td style={styles.td}>{m.name}</td>
              <td style={styles.td}>
                <span style={styles.calBadge}>{m.calories ?? 0} kcal</span>
              </td>
              <td style={styles.td}>{formatDate(m.date || m.createdAt)}</td>
              <td style={styles.td}>
                <button style={styles.editBtn} onClick={() => onEdit(m)}>Edit</button>
                <button style={styles.delBtn}  onClick={() => onDelete(m._id)}>Delete</button>
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
  calBadge: { 
    background: 'var(--accent-primary-alpha)', 
    color: 'var(--accent-primary)', 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '12px', 
    fontWeight: '700',
    border: '1px solid rgba(208, 253, 62, 0.2)'
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

export default MealTable;

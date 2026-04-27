import React from 'react';
import { formatDate } from '../utils/adminHelpers';

const EventTable = ({ events, onEdit, onDelete }) => (
  <div style={styles.wrapper}>
    <table style={styles.table}>
      <thead>
        <tr>
          {['Title', 'Description', 'Date', 'Time', 'Location', 'Type', 'Actions'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {events.length === 0 ? (
          <tr><td colSpan={7} style={styles.empty}>No events found.</td></tr>
        ) : (
          events.map((e) => (
            <tr key={e._id}>
              <td style={styles.td}>{e.title}</td>
              <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || '—'}</td>
              <td style={styles.td}>{formatDate(e.date || e.createdAt)}</td>
              <td style={styles.td}>{e.time ? `🕒 ${e.time}` : '—'}</td>
              <td style={styles.td}>{e.location || '—'}</td>
              <td style={styles.td}>
                <span style={styles.badge}>{e.type || 'General'}</span>
              </td>
              <td style={styles.td}>
                <button style={styles.editBtn} onClick={() => onEdit(e)}>Edit</button>
                <button style={styles.delBtn}  onClick={() => onDelete(e._id)}>Delete</button>
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
  badge:   { 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '11px', 
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    background: 'var(--accent-primary-alpha)',
    color: 'var(--accent-primary)',
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

export default EventTable;

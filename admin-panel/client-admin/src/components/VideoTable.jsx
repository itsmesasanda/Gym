import React from 'react';
import { formatDate } from '../utils/adminHelpers';

const VideoTable = ({ videos, onEdit, onDelete }) => (
  <div style={styles.wrapper}>
    <table style={styles.table}>
      <thead>
        <tr>
          {['Title', 'Description', 'Category', 'YouTube', 'Thumbnail', 'Date', 'Actions'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {videos.length === 0 ? (
          <tr><td colSpan={7} style={styles.empty}>No videos found.</td></tr>
        ) : (
          videos.map((v) => (
            <tr key={v._id}>
              <td style={styles.td}>{v.title}</td>
              <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.description || '—'}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: '#1e3a5f', color: '#93c5fd' }}>
                  {v.category || 'General'}
                </span>
              </td>
              <td style={styles.td}>
                {v.youtubeUrl ? <a href={v.youtubeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Open</a> : '—'}
              </td>
              <td style={styles.td}>
                {v.thumbnail ? <a href={v.thumbnail} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Open</a> : 'Auto'}
              </td>
              <td style={styles.td}>{formatDate(v.createdAt)}</td>
              <td style={styles.td}>
                <button style={styles.editBtn} onClick={() => onEdit(v)}>Edit</button>
                <button style={styles.delBtn}  onClick={() => onDelete(v._id)}>Delete</button>
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

export default VideoTable;

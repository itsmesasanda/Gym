import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/adminApi';
import { formatCurrencyLKR } from '../utils/adminHelpers';

const ManagePayments = () => {
  const location = useLocation();
  const [payments,   setPayments]   = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [msg,        setMsg]        = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.payments.getAll();
      setPayments(data);
      filterPayments(data, searchUser, filterStatus);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    if (search) {
      setSearchUser(search);
    }
  }, [location.search]);

  useEffect(() => {
    filterPayments(payments, searchUser, filterStatus);
  }, [payments, searchUser, filterStatus]);

  const flash = (text, isErr = false) => {
    isErr ? setError(text) : setMsg(text);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const filterPayments = (data, search, status) => {
    let filtered = data;
    if (search) {
      filtered = filtered.filter(p => 
        p.userName.toLowerCase().includes(search.toLowerCase()) ||
        p.userEmail.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status !== 'All') {
      filtered = filtered.filter(p => p.status === status);
    }
    setFilteredPayments(filtered);
  };

  const handleSearch = (e) => {
    setSearchUser(e.target.value);
    filterPayments(payments, e.target.value, filterStatus);
  };

  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
    filterPayments(payments, searchUser, e.target.value);
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.payments.updateStatus(id, 'Paid');
      flash('Payment marked as paid');
      load();
    } catch (err) {
      flash(err.message, true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await api.payments.delete(id);
      flash('Payment deleted');
      load();
    } catch (err) {
      flash(err.message, true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'rgba(50, 215, 75, 0.2)';
      case 'Pending': return 'rgba(255, 159, 64, 0.2)';
      case 'Overdue': return 'rgba(255, 69, 58, 0.2)';
      case 'Failed': return 'rgba(255, 69, 58, 0.2)';
      default: return 'rgba(150, 150, 150, 0.2)';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Paid': return 'var(--success)';
      case 'Pending': return '#ff9f40';
      case 'Overdue': return 'var(--danger)';
      case 'Failed': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div>
      <h2 style={s.heading}>Payment History</h2>
      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}

      <div style={s.filterCard}>
        <div style={s.filterGroup}>
          <label style={s.label}>Search by Name or Email</label>
          <input 
            style={s.filterInput} 
            type="text" 
            placeholder="Search user..." 
            value={searchUser}
            onChange={handleSearch}
          />
        </div>

        <div style={s.filterGroup}>
          <label style={s.label}>Filter by Status</label>
          <select 
            style={s.filterInput} 
            value={filterStatus}
            onChange={handleStatusFilter}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Paid</option>
            <option>Overdue</option>
            <option>Failed</option>
          </select>
        </div>
      </div>

      <div style={s.tableCard}>
        {loading ? (
          <div style={s.loadingText}>Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div style={s.emptyText}>No payments found</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={s.headerRow}>
                <th style={s.th}>User Name</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Plan</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}>Payment Date</th>
                <th style={s.th}>Due Date</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Method</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment._id} style={s.row}>
                  <td style={s.td}>{payment.userName}</td>
                  <td style={s.td}>{payment.userEmail}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, backgroundColor: 'rgba(150, 150, 255, 0.2)', color: '#6b9eff' }}>
                      {payment.plan}
                    </span>
                  </td>
                  <td style={{...s.td, fontWeight: '700', color: 'var(--accent-primary)'}}>{formatCurrencyLKR(payment.amount)}</td>
                  <td style={s.td}>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td style={s.td}>{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '—'}</td>
                  <td style={s.td}>
                    <span style={{
                      ...s.statusBadge,
                      backgroundColor: getStatusColor(payment.status),
                      color: getStatusTextColor(payment.status)
                    }}>
                      {payment.status}
                    </span>
                  </td>
                  <td style={s.td}>{payment.paymentMethod || '—'}</td>
                  <td style={{...s.td, display: 'flex', gap: '8px'}}>
                    {payment.status !== 'Paid' && (
                      <button 
                        style={s.actionBtn}
                        onClick={() => handleMarkPaid(payment._id)}
                        title="Mark as Paid"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button 
                      style={{...s.actionBtn, backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--danger)'}}
                      onClick={() => handleDelete(payment._id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={s.statsCard}>
        <div style={s.stat}>
          <span style={s.statLabel}>Total Payments</span>
          <span style={s.statValue}>{payments.length}</span>
        </div>
        <div style={s.stat}>
          <span style={s.statLabel}>Paid</span>
          <span style={{...s.statValue, color: 'var(--success)'}}>
            {payments.filter(p => p.status === 'Paid').length}
          </span>
        </div>
        <div style={s.stat}>
          <span style={s.statLabel}>Pending</span>
          <span style={{...s.statValue, color: '#ff9f40'}}>
            {payments.filter(p => p.status === 'Pending').length}
          </span>
        </div>
        <div style={s.stat}>
          <span style={s.statLabel}>Overdue</span>
          <span style={{...s.statValue, color: 'var(--danger)'}}>
            {payments.filter(p => p.status === 'Overdue').length}
          </span>
        </div>
        <div style={s.stat}>
          <span style={s.statLabel}>Total Amount</span>
          <span style={{...s.statValue, color: 'var(--accent-primary)'}}>
            {formatCurrencyLKR(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

const s = {
  heading: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '24px',
    letterSpacing: '-0.02em'
  },
  success: { 
    background: 'rgba(50, 215, 75, 0.1)', 
    color: 'var(--success)', 
    padding: '12px 16px', 
    borderRadius: 'var(--radius-md)', 
    fontSize: '14px', 
    border: '1px solid rgba(50, 215, 75, 0.2)', 
    marginBottom: '16px' 
  },
  error: { 
    background: 'rgba(255, 69, 58, 0.1)', 
    color: 'var(--danger)', 
    padding: '12px 16px', 
    borderRadius: 'var(--radius-md)', 
    fontSize: '14px', 
    border: '1px solid rgba(255, 69, 58, 0.2)', 
    marginBottom: '16px' 
  },
  filterCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  filterInput: {
    background: 'var(--bg-tertiary)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none'
  },
  tableCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'auto',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  headerRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: '12px',
    letterSpacing: '0.08em'
  },
  row: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '16px',
    color: 'var(--text-primary)'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '600'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '600'
  },
  actionBtn: {
    background: 'rgba(50, 215, 75, 0.2)',
    color: 'var(--success)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  loadingText: {
    padding: '40px 16px',
    textAlign: 'center',
    color: 'var(--text-secondary)'
  },
  emptyText: {
    padding: '40px 16px',
    textAlign: 'center',
    color: 'var(--text-secondary)'
  },
  statsCard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px'
  },
  stat: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--text-primary)'
  }
};

export default ManagePayments;

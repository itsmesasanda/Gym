import React, { useEffect, useState } from 'react';
import UserTable from '../components/UserTable';
import { api } from '../services/adminApi';
import { userService } from '../services/userService';
import { clone, formatCurrencyLKR } from '../utils/adminHelpers';
import { validateUserForm } from '../utils/validations';

const EMPTY = { name: '', email: '', phone: '', plan: 'Basic', paid: false, notes: '', joinDate: '' };

const getTodayValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ManageUsers = () => {
  const [users,      setUsers]      = useState([]);
  const [form,       setForm]       = useState(EMPTY);
  const [editId,     setEditId]     = useState(null);
  const [msg,        setMsg]        = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [phoneCount, setPhoneCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const load = async () => {
    try { setUsers(await userService.getAll()); }
    catch (e) { setError(e.message); }
  };

  useEffect(() => { load(); }, []);

  const flash = (text, isErr = false) => {
    isErr ? setError(text) : setMsg(text);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Update phone count for phone field
    if (name === 'phone') {
      const digitsOnly = String(newValue).replace(/\D/g, '').slice(0, 10);
      newValue = digitsOnly;
      setPhoneCount(digitsOnly.length);
    }
    
    setForm((p) => ({ ...p, [name]: newValue }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const validation = validateUserForm(form);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      flash('Please fix the errors below', true);
      return;
    }
    
    setFormErrors({});
    setLoading(true);
    try {
      if (editId) { await userService.update(editId, form); flash('User updated'); }
      else        { await userService.create(form);         flash('User created'); }
      setForm(EMPTY); setEditId(null); setPhoneCount(0); load();
    } catch (err) { flash(err.message, true); }
    finally { setLoading(false); }
  };

  const handleEdit   = (u) => {
    const normalizedPhone = String(u.phone || '').replace(/\D/g, '').slice(0, 10);
    setForm({ ...clone(u), phone: normalizedPhone });
    setEditId(u._id);
    setPhoneCount(normalizedPhone.length);
  };
  const handleViewHistory = async (u) => {
    setHistoryOpen(true);
    setHistoryUser(u);
    setHistoryPayments([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const payments = await api.payments.getByUserId(u._id, u.email);
      setHistoryPayments(payments);
    } catch (err) {
      setHistoryError(err.message || 'Failed to load payment history');
    } finally {
      setHistoryLoading(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await userService.remove(id); flash('Deleted'); load(); }
    catch (err) { flash(err.message, true); }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryUser(null);
    setHistoryPayments([]);
    setHistoryError('');
  };

  const getInputStyle = (fieldName) => ({
    ...s.input,
    borderColor: formErrors[fieldName] ? 'rgba(255, 69, 58, 0.5)' : 'rgba(255, 255, 255, 0.08)',
    backgroundColor: formErrors[fieldName] ? 'rgba(255, 69, 58, 0.1)' : 'var(--bg-tertiary)',
  });

  return (
    <div>
      <h2 style={s.heading}>Manage Users</h2>
      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <h3 style={s.formTitle}>{editId ? 'Edit User' : 'Add New User'}</h3>
        <div style={s.grid}>
          <div style={s.field}>
            <label style={s.label}>Member Name *</label>
            <input 
              style={getInputStyle('name')} 
              name="name" 
              type="text" 
              placeholder="Member Name" 
              value={form.name || ''} 
              onChange={handleChange} 
            />
            {formErrors.name && <span style={s.errorText}>{formErrors.name}</span>}
          </div>
          
          <div style={s.field}>
            <label style={s.label}>Email *</label>
            <input 
              style={getInputStyle('email')} 
              name="email" 
              type="email" 
              placeholder="user@gmail.com" 
              value={form.email || ''} 
              onChange={handleChange} 
            />
            {formErrors.email && <span style={s.errorText}>{formErrors.email}</span>}
          </div>
          
          <div style={s.field}>
            <label style={s.label}>Phone (10 digits) * <span style={s.counter}>({phoneCount}/10)</span></label>
            <input 
              style={getInputStyle('phone')} 
              name="phone" 
              type="tel" 
              inputMode="numeric"
              placeholder="1234567890" 
              value={form.phone || ''} 
              onChange={handleChange}
              maxLength="10"
            />
            {formErrors.phone && <span style={s.errorText}>{formErrors.phone}</span>}
          </div>
          
          <div style={s.field}>
            <label style={s.label}>Join Date (Today or Future) *</label>
            <input 
              style={getInputStyle('joinDate')} 
              name="joinDate" 
              type="date" 
              min={getTodayValue()}
              value={form.joinDate || ''} 
              onChange={handleChange}
            />
            {formErrors.joinDate && <span style={s.errorText}>{formErrors.joinDate}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Plan *</label>
            <select 
              style={getInputStyle('plan')} 
              name="plan" 
              value={form.plan} 
              onChange={handleChange}
            >
              {['Basic','Standard','Premium'].map((p) => <option key={p}>{p}</option>)}
            </select>
            {formErrors.plan && <span style={s.errorText}>{formErrors.plan}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Notes</label>
            <input 
              style={s.input} 
              name="notes" 
              type="text" 
              placeholder="Additional notes" 
              value={form.notes || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>
        
        <div style={{ ...s.field, flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '20px', marginBottom: '10px' }}>
          <input type="checkbox" id="paid" name="paid" checked={form.paid} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }} />
          <label htmlFor="paid" style={{ ...s.label, margin: 0, cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>Mark as Paid User</label>
        </div>
        
        <div style={s.btnRow}>
          <button style={s.submitBtn} type="submit" disabled={loading}>{loading ? 'Saving…' : editId ? 'Update User' : 'Add User'}</button>
          {editId && <button style={s.cancelBtn} type="button" onClick={() => { setEditId(null); setForm(EMPTY); setPhoneCount(0); setFormErrors({}); }}>Cancel</button>}
        </div>
      </form>

      <div style={s.tableCard}>
        <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} onViewHistory={handleViewHistory} />
      </div>

      {historyOpen && (
        <div style={s.modalOverlay} onClick={closeHistory}>
          <div style={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>Payment History</h3>
                <p style={s.modalSubtitle}>{historyUser?.name || 'User'} - {historyUser?.email || 'No email available'}</p>
              </div>
              <button type="button" style={s.modalCloseBtn} onClick={closeHistory}>Close</button>
            </div>

            {historyLoading ? (
              <div style={s.modalEmpty}>Loading payment history…</div>
            ) : historyError ? (
              <div style={s.modalError}>{historyError}</div>
            ) : historyPayments.length === 0 ? (
              <div style={s.modalEmpty}>No payments recorded for this user.</div>
            ) : (
              <div style={s.paymentList}>
                {historyPayments.map((payment) => (
                  <div key={payment._id} style={s.paymentCard}>
                    <div style={s.paymentTopRow}>
                      <strong style={s.paymentAmount}>{formatCurrencyLKR(payment.amount)}</strong>
                      <span style={{ ...s.statusBadge, background: payment.status === 'Paid' ? 'rgba(50, 215, 75, 0.15)' : 'rgba(255, 159, 64, 0.15)', color: payment.status === 'Paid' ? 'var(--success)' : '#ff9f40' }}>
                        {payment.status}
                      </span>
                    </div>
                    <div style={s.paymentMeta}>
                      <span><strong>Plan:</strong> {payment.plan || '—'}</span>
                      <span><strong>Paid on:</strong> {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '—'}</span>
                      <span><strong>Due:</strong> {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '—'}</span>
                      <span><strong>Method:</strong> {payment.paymentMethod || '—'}</span>
                    </div>
                    {payment.notes && <p style={s.paymentNotes}>{payment.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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
  success: { background: 'rgba(50, 215, 75, 0.1)', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', border: '1px solid rgba(50, 215, 75, 0.2)', marginBottom: '16px' },
  error: { background: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', border: '1px solid rgba(255, 69, 58, 0.2)', marginBottom: '16px' },
  form: { 
    background: 'var(--bg-secondary)', 
    borderRadius: 'var(--radius-lg)', 
    padding: '32px', 
    marginBottom: '32px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: 'var(--shadow-sm)' 
  },
  formTitle: { 
    color: 'var(--text-primary)', 
    fontSize: '18px', 
    fontWeight: '700', 
    marginTop: 0, 
    marginBottom: '24px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { 
    fontSize: '12px', 
    color: 'var(--text-secondary)', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: '0.08em' 
  },
  input: { 
    background: 'var(--bg-tertiary)', 
    border: '1px solid rgba(255, 255, 255, 0.08)', 
    borderRadius: 'var(--radius-md)', 
    padding: '12px 16px', 
    color: 'var(--text-primary)', 
    fontSize: '14px', 
    outline: 'none',
    transition: 'var(--transition)'
  },
  btnRow: { display: 'flex', gap: '12px', marginTop: '24px' },
  submitBtn: { 
    background: 'var(--accent-primary)', 
    color: '#000', 
    border: 'none', 
    borderRadius: 'var(--radius-md)', 
    padding: '12px 24px', 
    fontSize: '14px', 
    fontWeight: '700', 
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  cancelBtn: { 
    background: 'transparent', 
    color: 'var(--text-secondary)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: 'var(--radius-md)', 
    padding: '12px 24px', 
    fontSize: '14px', 
    fontWeight: '700', 
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  tableCard: { 
    background: 'transparent', 
    borderRadius: 'var(--radius-lg)', 
    overflow: 'hidden' 
  },
  errorText: {
    color: 'var(--danger)',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '4px',
    display: 'block'
  },
  counter: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    marginLeft: '8px'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 1000,
  },
  modalCard: {
    width: 'min(760px, 100%)',
    maxHeight: '80vh',
    overflowY: 'auto',
    background: 'var(--bg-secondary)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
  },
  modalTitle: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: '22px',
    fontWeight: '800',
  },
  modalSubtitle: {
    margin: '6px 0 0',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  modalCloseBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
  },
  modalEmpty: {
    padding: '28px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    background: 'var(--bg-tertiary)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  modalError: {
    padding: '16px',
    textAlign: 'center',
    color: 'var(--danger)',
    background: 'rgba(255,69,58,0.08)',
    borderRadius: '14px',
    border: '1px solid rgba(255,69,58,0.18)',
  },
  paymentList: {
    display: 'grid',
    gap: '12px',
  },
  paymentCard: {
    background: 'var(--bg-tertiary)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '16px',
  },
  paymentTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '12px',
  },
  paymentAmount: {
    color: 'var(--accent-primary)',
    fontSize: '18px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  paymentMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '8px 12px',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  paymentNotes: {
    margin: '12px 0 0',
    color: 'var(--text-primary)',
    fontSize: '14px',
    lineHeight: 1.5,
  },
};

export default ManageUsers;

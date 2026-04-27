import React, { useEffect, useState } from 'react';
import AnnouncementTable from '../components/AnnouncementTable';
import { api } from '../services/adminApi';
import { clone } from '../utils/adminHelpers';
import { validateAnnouncementForm } from '../utils/validations';

const EMPTY = { title: '', body: '', date: '', pinned: false, priority: 'normal' };

const getTodayValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [form,          setForm]          = useState(EMPTY);
  const [editId,        setEditId]        = useState(null);
  const [msg,           setMsg]           = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [formErrors,    setFormErrors]    = useState({});

  const load = async () => {
    try { setAnnouncements(await api.announcements.getAll()); }
    catch (e) { setError(e.message); }
  };

  useEffect(() => { load(); }, []);

  const flash = (text, isErr = false) => {
    isErr ? setError(text) : setMsg(text);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const validation = validateAnnouncementForm(form);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      flash('Please fix the errors below', true);
      return;
    }
    
    setFormErrors({});
    setLoading(true);
    try {
      if (editId) { await api.announcements.update(editId, form); flash('Announcement updated'); }
      else        { await api.announcements.create(form);         flash('Announcement created'); }
      setForm(EMPTY); setEditId(null); load();
    } catch (err) { flash(err.message, true); }
    finally { setLoading(false); }
  };

  const handleEdit   = (a) => { setForm(clone(a)); setEditId(a._id); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await api.announcements.delete(id); flash('Deleted'); load(); }
    catch (err) { flash(err.message, true); }
  };

  const getInputStyle = (fieldName) => ({
    ...s.input,
    borderColor: formErrors[fieldName] ? 'rgba(255, 69, 58, 0.5)' : 'rgba(255, 255, 255, 0.08)',
    backgroundColor: formErrors[fieldName] ? 'rgba(255, 69, 58, 0.1)' : 'var(--bg-tertiary)',
  });

  return (
    <div>
      <h2 style={s.heading}>Manage Announcements</h2>
      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <h3 style={s.formTitle}>{editId ? 'Edit Announcement' : 'Add New Announcement'}</h3>
        <div style={s.grid}>
          <div style={s.field}>
            <label style={s.label}>Title *</label>
            <input 
              style={getInputStyle('title')} 
              name="title" 
              placeholder="Announcement Title" 
              value={form.title} 
              onChange={handleChange} 
            />
            {formErrors.title && <span style={s.errorText}>{formErrors.title}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Date (Today or Future) *</label>
            <input 
              style={getInputStyle('date')} 
              name="date" 
              type="date" 
              min={getTodayValue()}
              value={form.date} 
              onChange={handleChange} 
            />
            {formErrors.date && <span style={s.errorText}>{formErrors.date}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Priority *</label>
            <select 
              style={getInputStyle('priority')} 
              name="priority" 
              value={form.priority} 
              onChange={handleChange}
            >
              {['normal','high'].map((p) => <option key={p}>{p}</option>)}
            </select>
            {formErrors.priority && <span style={s.errorText}>{formErrors.priority}</span>}
          </div>

          <div style={{ ...s.field, flexDirection: 'row', alignItems: 'center', gap: '10px', paddingTop: '20px' }}>
            <input type="checkbox" id="pinned" name="pinned" checked={form.pinned} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="pinned" style={{ ...s.label, margin: 0, cursor: 'pointer' }}>Pinned</label>
          </div>

          <div style={{ ...s.field, gridColumn: '1 / -1' }}>
            <label style={s.label}>Body Content</label>
            <textarea 
              style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} 
              name="body" 
              placeholder="Write announcement details..." 
              value={form.body} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div style={s.btnRow}>
          <button style={s.submitBtn} type="submit" disabled={loading}>{loading ? 'Saving…' : editId ? 'Update' : 'Add Announcement'}</button>
          {editId && <button style={s.cancelBtn} type="button" onClick={() => { setEditId(null); setForm(EMPTY); setFormErrors({}); }}>Cancel</button>}
        </div>
      </form>

      <div style={s.tableCard}>
        <AnnouncementTable announcements={announcements} onEdit={handleEdit} onDelete={handleDelete} />
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
};

export default ManageAnnouncements;

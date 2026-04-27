import React, { useEffect, useState } from 'react';
import EventTable from '../components/EventTable';
import { api } from '../services/adminApi';
import { clone } from '../utils/adminHelpers';
import { validateEventForm } from '../utils/validations';

const EMPTY = { title: '', description: '', date: '', time: '', location: '', type: 'General' };

const getTodayValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ManageEvents = () => {
  const [events,      setEvents]      = useState([]);
  const [form,        setForm]        = useState(EMPTY);
  const [editId,      setEditId]      = useState(null);
  const [msg,         setMsg]         = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [formErrors,  setFormErrors]  = useState({});

  const load = async () => {
    try { setEvents(await api.events.getAll()); }
    catch (e) { setError(e.message); }
  };

  useEffect(() => { load(); }, []);

  const flash = (text, isErr = false) => {
    isErr ? setError(text) : setMsg(text);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const validation = validateEventForm(form);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      flash('Please fix the errors below', true);
      return;
    }
    
    setFormErrors({});
    setLoading(true);
    try {
      if (editId) { await api.events.update(editId, form); flash('Event updated'); }
      else        { await api.events.create(form);         flash('Event created'); }
      setForm(EMPTY); setEditId(null); load();
    } catch (err) { flash(err.message, true); }
    finally { setLoading(false); }
  };

  const handleEdit   = (ev) => { setForm(clone(ev)); setEditId(ev._id); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await api.events.delete(id); flash('Deleted'); load(); }
    catch (err) { flash(err.message, true); }
  };

  const getInputStyle = (fieldName) => ({
    ...s.input,
    borderColor: formErrors[fieldName] ? 'rgba(255, 69, 58, 0.5)' : 'rgba(255, 255, 255, 0.08)',
    backgroundColor: formErrors[fieldName] ? 'rgba(255, 69, 58, 0.1)' : 'var(--bg-tertiary)',
  });

  return (
    <div>
      <h2 style={s.heading}>Manage Events</h2>
      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <h3 style={s.formTitle}>{editId ? 'Edit Event' : 'Add New Event'}</h3>
        <div style={s.grid}>
          <div style={s.field}>
            <label style={s.label}>Title *</label>
            <input 
              style={getInputStyle('title')} 
              name="title" 
              placeholder="Event Title" 
              value={form.title} 
              onChange={handleChange} 
            />
            {formErrors.title && <span style={s.errorText}>{formErrors.title}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Location *</label>
            <input 
              style={getInputStyle('location')} 
              name="location" 
              placeholder="Venue / Online" 
              value={form.location} 
              onChange={handleChange} 
            />
            {formErrors.location && <span style={s.errorText}>{formErrors.location}</span>}
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
            <label style={s.label}>Time *</label>
            <input 
              style={getInputStyle('time')} 
              name="time" 
              type="time" 
              value={form.time} 
              onChange={handleChange} 
            />
            {formErrors.time && <span style={s.errorText}>{formErrors.time}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Type *</label>
            <select 
              style={getInputStyle('type')} 
              name="type" 
              value={form.type} 
              onChange={handleChange}
            >
              {['General','Workshop','Webinar','Meetup'].map((t) => <option key={t}>{t}</option>)}
            </select>
            {formErrors.type && <span style={s.errorText}>{formErrors.type}</span>}
          </div>

          <div style={{ ...s.field, gridColumn: '1 / -1' }}>
            <label style={s.label}>Description</label>
            <textarea 
              style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} 
              name="description" 
              placeholder="Event details..." 
              value={form.description} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div style={s.btnRow}>
          <button style={s.submitBtn} type="submit" disabled={loading}>{loading ? 'Saving…' : editId ? 'Update Event' : 'Add Event'}</button>
          {editId && <button style={s.cancelBtn} type="button" onClick={() => { setEditId(null); setForm(EMPTY); setFormErrors({}); }}>Cancel</button>}
        </div>
      </form>

      <div style={s.tableCard}>
        <EventTable events={events} onEdit={handleEdit} onDelete={handleDelete} />
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

export default ManageEvents;

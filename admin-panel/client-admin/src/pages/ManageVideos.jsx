import React, { useEffect, useState } from 'react';
import VideoTable from '../components/VideoTable';
import { api } from '../services/adminApi';
import { clone } from '../utils/adminHelpers';

const EMPTY = { title: '', description: '', videoLink: '', uploadedDate: '', pinned: false, priority: 'normal' };

const ManageVideos = () => {
  const [videos,  setVideos]  = useState([]);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { setVideos(await api.videos.getAll()); }
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) { await api.videos.update(editId, form); flash('Video updated'); }
      else        { await api.videos.create(form);          flash('Video added'); }
      setForm(EMPTY); setEditId(null); load();
    } catch (err) { flash(err.message, true); }
    finally { setLoading(false); }
  };

  const handleEdit = (v) => { setForm(clone(v)); setEditId(v._id); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    try { await api.videos.delete(id); flash('Deleted'); load(); }
    catch (err) { flash(err.message, true); }
  };

  return (
    <div>
      <h2 style={s.heading}>Manage Videos</h2>
      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}
      <form onSubmit={handleSubmit} style={s.form}>
        <h3 style={s.formTitle}>{editId ? 'Edit Video' : 'Add New Video'}</h3>
        <div style={s.grid}>
          <div style={s.field}><label style={s.label}>Title</label><input style={s.input} name="title" placeholder="Title" value={form.title} onChange={handleChange} required /></div>
          <div style={s.field}><label style={s.label}>Description</label><input style={s.input} name="description" placeholder="Description" value={form.description} onChange={handleChange} /></div>
          <div style={s.field}><label style={s.label}>Video Link</label><input style={s.input} name="videoLink" placeholder="URL" value={form.videoLink} onChange={handleChange} required /></div>
          <div style={s.field}><label style={s.label}>Uploaded Date</label><input style={s.input} name="uploadedDate" type="date" value={form.uploadedDate} onChange={handleChange} /></div>
          <div style={s.field}>
            <label style={s.label}>Priority</label>
            <select style={s.input} name="priority" value={form.priority} onChange={handleChange}>
              {['normal','high'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
          <input type="checkbox" id="pinned" name="pinned" checked={form.pinned} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
          <label htmlFor="pinned" style={{ ...s.label, margin: 0, cursor: 'pointer' }}>Pinned</label>
        </div>
        <div style={s.btnRow}>
          <button style={s.submitBtn} type="submit" disabled={loading}>{loading ? 'Saving…' : editId ? 'Update' : 'Add Video'}</button>
          {editId && <button style={s.cancelBtn} type="button" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>
      <div style={s.tableCard}><VideoTable videos={videos} onEdit={handleEdit} onDelete={handleDelete} /></div>
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
};

export default ManageVideos;

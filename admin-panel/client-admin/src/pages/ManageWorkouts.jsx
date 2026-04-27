import React, { useEffect, useState } from 'react';
import WorkoutTable from '../components/WorkoutTable';
import { workoutService } from '../services/workoutService';

const EMPTY = { exerciseName: '', muscleGroup: 'Chest', reps: '6', weight: '0', duration: '0', notes: '' };
const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Biceps', 'Triceps', 'Core'];

const ManageWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const load = async () => {
    try { setWorkouts(await workoutService.getAll()); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const flash = (text, isErr = false) => {
    isErr ? setError(text) : setMsg(text);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.exerciseName.trim().length < 2 || form.exerciseName.trim().length > 50) {
      return flash('Exercise name must be 2-50 characters', true);
    }
    if (!MUSCLE_GROUPS.includes(form.muscleGroup)) {
      return flash('Choose a valid muscle group', true);
    }
    const reps = Number(form.reps);
    const weight = Number(form.weight);
    const duration = Number(form.duration || 0);
    if (!Number.isFinite(reps) || reps < 6 || reps > 15) return flash('Reps must be between 6 and 15', true);
    if (!Number.isFinite(weight) || weight < 0) return flash('Weight cannot be negative', true);
    if (!Number.isFinite(duration) || duration < 0 || (duration > 0 && duration < 5)) {
      return flash('Duration must be 0 or at least 5 minutes', true);
    }
    if (form.notes.length > 500) return flash('Notes cannot exceed 500 characters', true);

    setLoading(true);
    try {
      if (editId) { await workoutService.update(editId, form); flash('Workout updated'); }
      else        { await workoutService.create(form);          flash('Workout added'); }
      setForm(EMPTY); setEditId(null); load();
    } catch (err) { flash(err.message, true); }
    finally { setLoading(false); }
  };

  const handleEdit = (w) => {
    setForm({
      exerciseName: w.exerciseName || '',
      muscleGroup: w.muscleGroup || 'Chest',
      reps: String(w.sets?.[0]?.reps ?? '6'),
      weight: String(w.sets?.[0]?.weight ?? '0'),
      duration: String(w.duration ?? '0'),
      notes: w.notes || '',
    });
    setEditId(w._id);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    try { await workoutService.remove(id); flash('Deleted'); load(); }
    catch (err) { flash(err.message, true); }
  };

  const fields = [
    ['exerciseName','Exercise Name','text',true],
    ['reps','Reps','number',true],
    ['weight','Weight','number',true],
    ['duration','Duration','number',false],
    ['notes','Notes','text',false],
  ];

  return (
    <div>
      <h2 style={s.heading}>Manage Workouts</h2>
      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}
      <form onSubmit={handleSubmit} style={s.form}>
        <h3 style={s.formTitle}>{editId ? 'Edit Workout' : 'Add New Workout'}</h3>
        <div style={s.grid}>
          <div style={s.field}>
            <label style={s.label}>Muscle Group</label>
            <select style={s.input} name="muscleGroup" value={form.muscleGroup} onChange={handleChange} required>
              {MUSCLE_GROUPS.map((group) => <option key={group}>{group}</option>)}
            </select>
          </div>
          {fields.map(([name, label, type, req]) => (
            <div key={name} style={s.field}>
              <label style={s.label}>{label}</label>
              <input style={s.input} name={name} type={type} placeholder={label} value={form[name] || ''} onChange={handleChange} required={req} />
            </div>
          ))}
        </div>
        <div style={s.btnRow}>
          <button style={s.submitBtn} type="submit" disabled={loading}>{loading ? 'Saving…' : editId ? 'Update' : 'Add Workout'}</button>
          {editId && <button style={s.cancelBtn} type="button" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>
      <div style={s.tableCard}><WorkoutTable workouts={workouts} onEdit={handleEdit} onDelete={handleDelete} /></div>
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

export default ManageWorkouts;

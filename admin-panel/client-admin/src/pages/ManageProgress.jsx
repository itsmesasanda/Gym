import React, { useState, useEffect } from 'react';
import { progressService } from '../services/progressService';

const ManageProgress = () => {
  const [activeTab, setActiveTab] = useState('exercises'); // 'exercises' | 'bodystats'
  const [goals, setGoals] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);

  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState(null);

  const [showDeleteMeasurementModal, setShowDeleteMeasurementModal] = useState(false);
  const [deletingMeasurementId, setDeletingMeasurementId] = useState(null);

  const [notification, setNotification] = useState(null);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  useEffect(() => {
    fetchGoals();
    fetchMeasurements();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await progressService.getGoals();
      setGoals(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMeasurements = async () => {
    try {
      const data = await progressService.getMeasurements();
      setMeasurements(data);
    } catch (err) {
      console.error(err);
    }
  };

  // -- GOALS --
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const goalData = {
      exerciseName: fd.get('exerciseName'),
      targetKg: Number(fd.get('targetKg')),
      targetReps: Number(fd.get('targetReps')),
      targetSets: Number(fd.get('targetSets')),
      currentKg: Number(fd.get('currentKg') || 0),
      currentReps: Number(fd.get('currentReps') || 0),
      currentSets: Number(fd.get('currentSets') || 0),
    };

    try {
      if (editingGoal) {
        await progressService.updateGoal(editingGoal._id, goalData);
        showNotification('Goal updated successfully!');
      } else {
        await progressService.createGoal(goalData);
        showNotification('Goal created successfully!');
      }
      setShowGoalModal(false);
      setEditingGoal(null);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async () => {
    if (deletingGoalId) {
      try {
        await progressService.deleteGoal(deletingGoalId);
        showNotification('Goal deleted successfully!');
        fetchGoals();
      } catch (err) {
        console.error(err);
      } finally {
        setShowDeleteGoalModal(false);
        setDeletingGoalId(null);
      }
    }
  };

  // -- MEASUREMENTS --
  const handleSaveMeasurement = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const measurementData = {
      date: fd.get('date'),
      weight: Number(fd.get('weight')),
      bodyFat: Number(fd.get('bodyFat')),
      waist: Number(fd.get('waist')),
    };

    try {
      if (editingMeasurement) {
        await progressService.updateMeasurement(editingMeasurement._id, measurementData);
        showNotification('Measurement updated successfully!');
      } else {
        await progressService.createMeasurement(measurementData);
        showNotification('Measurement logged successfully!');
      }
      setShowMeasurementModal(false);
      setEditingMeasurement(null);
      fetchMeasurements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeasurement = async () => {
    if (deletingMeasurementId) {
      try {
        await progressService.deleteMeasurement(deletingMeasurementId);
        showNotification('Measurement deleted successfully!');
        fetchMeasurements();
      } catch (err) {
        console.error(err);
      } finally {
        setShowDeleteMeasurementModal(false);
        setDeletingMeasurementId(null);
      }
    }
  };

  const calculateProgress = (current, target) => {
    if (!target) return 0;
    const pct = (current / target) * 100;
    return Math.min(Math.round(pct), 100);
  };

  const getOverallProgress = (goal) => {
    const p1 = calculateProgress(goal.currentKg, goal.targetKg);
    const p2 = calculateProgress(goal.currentReps, goal.targetReps);
    const p3 = calculateProgress(goal.currentSets, goal.targetSets);
    return Math.round((p1 + p2 + p3) / 3);
  };

  return (
    <div style={styles.container}>
      {notification && (
        <div style={styles.toast}>
          {notification}
        </div>
      )}

      <h2 style={styles.heading}>Progress Tracking Dashboard</h2>

      <div style={styles.tabContainer}>
        <button 
          style={activeTab === 'exercises' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('exercises')}
        >
          Exercises
        </button>
        <button 
          style={activeTab === 'bodystats' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('bodystats')}
        >
          Body Stats
        </button>
      </div>

      {activeTab === 'exercises' ? (
        <div style={styles.section}>
          <div style={styles.headerRow}>
            <h3 style={styles.sectionTitle}>Exercise Goals</h3>
            <button 
              style={styles.addButton} 
              onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
            >
              + Add Goal
            </button>
          </div>

          <div style={styles.cardsGrid}>
            {goals.map(goal => {
              const progress = getOverallProgress(goal);
              return (
                <div key={goal._id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h4 style={styles.cardTitle}>{goal.exerciseName}</h4>
                    <div style={styles.cardActions}>
                      <button style={styles.textBtn} onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}>Edit</button>
                      <button style={styles.textBtnDelete} onClick={() => { setDeletingGoalId(goal._id); setShowDeleteGoalModal(true); }}>Delete</button>
                    </div>
                  </div>
                  
                  <div style={styles.progressSection}>
                    <div style={styles.progressLabelRow}>
                      <span>Overall Progress</span>
                      <span style={{color: 'var(--accent-primary)'}}>{progress}%</span>
                    </div>
                    <div style={styles.progressBarBg}>
                      <div style={{...styles.progressBarFill, width: `${progress}%`}}></div>
                    </div>
                  </div>

                  <div style={styles.statsRow}>
                    <div style={styles.statCol}>
                      <span style={styles.statLabel}>Weight</span>
                      <span style={styles.statValue}>{goal.currentKg}kg</span>
                      <span style={styles.statSub}>/ {goal.targetKg}kg</span>
                    </div>
                    <div style={styles.statCol}>
                      <span style={styles.statLabel}>Reps</span>
                      <span style={styles.statValue}>{goal.currentReps}</span>
                      <span style={styles.statSub}>/ {goal.targetReps}</span>
                    </div>
                    <div style={styles.statCol}>
                      <span style={styles.statLabel}>Sets</span>
                      <span style={styles.statValue}>{goal.currentSets}</span>
                      <span style={styles.statSub}>/ {goal.targetSets}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && <p style={styles.empty}>No exercise goals added yet.</p>}
          </div>
        </div>
      ) : (
        <div style={styles.section}>
          <div style={styles.headerRow}>
            <h3 style={styles.sectionTitle}>Body Measurements</h3>
            <button 
              style={styles.addButton} 
              onClick={() => { setEditingMeasurement(null); setShowMeasurementModal(true); }}
            >
              + Log Today
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>DATE</th>
                <th style={styles.th}>WEIGHT</th>
                <th style={styles.th}>BF%</th>
                <th style={styles.th}>WAIST</th>
                <th style={styles.th}>EDIT</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map(m => (
                <tr key={m._id}>
                  <td style={styles.td}>{m.date}</td>
                  <td style={{...styles.td, color: 'var(--accent-primary)', fontWeight: '700'}}>{m.weight}kg</td>
                  <td style={styles.td}>{m.bodyFat}%</td>
                  <td style={styles.td}>{m.waist}cm</td>
                  <td style={styles.td}>
                    <button style={styles.textBtn} onClick={() => { setEditingMeasurement(m); setShowMeasurementModal(true); }}>Edit</button>
                    <button style={styles.textBtnDelete} onClick={() => { setDeletingMeasurementId(m._id); setShowDeleteMeasurementModal(true); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {measurements.length === 0 && <p style={styles.empty}>No measurements logged yet.</p>}
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0}}>{editingGoal ? 'Edit Exercise Goal' : 'Add Exercise Goal'}</h3>
              <button style={styles.closeBtn} onClick={() => setShowGoalModal(false)}>Close</button>
            </div>
            <form onSubmit={handleSaveGoal} style={styles.form}>
              <label style={styles.label}>Exercise Name</label>
              <input style={styles.input} name="exerciseName" defaultValue={editingGoal?.exerciseName} required />

              <div style={styles.inputRow}>
                <div>
                  <label style={styles.label}>Target kg</label>
                  <input style={styles.input} type="number" name="targetKg" defaultValue={editingGoal?.targetKg || 0} required />
                </div>
                <div>
                  <label style={styles.label}>Target Reps</label>
                  <input style={styles.input} type="number" name="targetReps" defaultValue={editingGoal?.targetReps || 0} required />
                </div>
                <div>
                  <label style={styles.label}>Target Sets</label>
                  <input style={styles.input} type="number" name="targetSets" defaultValue={editingGoal?.targetSets || 0} required />
                </div>
              </div>

              {editingGoal && (
                <div style={styles.inputRow}>
                  <div>
                    <label style={styles.label}>Current kg</label>
                    <input style={styles.input} type="number" name="currentKg" defaultValue={editingGoal?.currentKg || 0} />
                  </div>
                  <div>
                    <label style={styles.label}>Current Reps</label>
                    <input style={styles.input} type="number" name="currentReps" defaultValue={editingGoal?.currentReps || 0} />
                  </div>
                  <div>
                    <label style={styles.label}>Current Sets</label>
                    <input style={styles.input} type="number" name="currentSets" defaultValue={editingGoal?.currentSets || 0} />
                  </div>
                </div>
              )}
              
              <button style={styles.submitBtn} type="submit">
                {editingGoal ? 'Save Changes' : 'Save Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Measurement Modal */}
      {showMeasurementModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0}}>{editingMeasurement ? 'Edit Measurement' : 'Log Measurement'}</h3>
              <button style={styles.closeBtn} onClick={() => setShowMeasurementModal(false)}>Close</button>
            </div>
            <form onSubmit={handleSaveMeasurement} style={styles.form}>
              <label style={styles.label}>Date</label>
              <input style={styles.input} type="date" name="date" defaultValue={editingMeasurement?.date || new Date().toISOString().split('T')[0]} required />

              <label style={styles.label}>Weight (kg)</label>
              <input style={styles.input} type="number" step="0.1" name="weight" defaultValue={editingMeasurement?.weight} required />

              <label style={styles.label}>Body Fat (%)</label>
              <input style={styles.input} type="number" step="0.1" name="bodyFat" defaultValue={editingMeasurement?.bodyFat} required />

              <label style={styles.label}>Waist (cm)</label>
              <input style={styles.input} type="number" step="0.1" name="waist" defaultValue={editingMeasurement?.waist} required />
              
              <button style={styles.submitBtn} type="submit">
                {editingMeasurement ? 'Save Changes' : 'Log Measurement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Goal Modal */}
      {showDeleteGoalModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.deleteModal}>
            <h3 style={styles.deleteModalTitle}>Delete Goal</h3>
            <p style={styles.deleteModalText}>Are you sure you want to delete this goal?</p>
            <div style={styles.deleteModalActions}>
              <button style={styles.cancelBtn} onClick={() => { setShowDeleteGoalModal(false); setDeletingGoalId(null); }}>Cancel</button>
              <button style={styles.deleteBtn} onClick={handleDeleteGoal}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Measurement Modal */}
      {showDeleteMeasurementModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.deleteModal}>
            <h3 style={styles.deleteModalTitle}>Delete Measurement</h3>
            <p style={styles.deleteModalText}>Are you sure you want to delete this measurement?</p>
            <div style={styles.deleteModalActions}>
              <button style={styles.cancelBtn} onClick={() => { setShowDeleteMeasurementModal(false); setDeletingMeasurementId(null); }}>Cancel</button>
              <button style={styles.deleteBtn} onClick={handleDeleteMeasurement}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  container: { paddingBottom: '40px', position: 'relative' },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    background: 'var(--accent-primary)',
    color: '#000',
    padding: '16px 24px',
    borderRadius: '8px',
    fontWeight: '700',
    boxShadow: '0 8px 24px rgba(208, 253, 62, 0.3)',
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out'
  },
  heading: { 
    fontSize: '32px', 
    fontWeight: '800', 
    color: 'var(--text-primary)', 
    marginBottom: '24px',
    letterSpacing: '-0.02em'
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    background: 'var(--bg-secondary)',
    padding: '8px',
    borderRadius: '12px',
    width: 'fit-content'
  },
  tabActive: {
    background: 'var(--accent-primary)',
    color: '#000',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tabInactive: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  section: { 
    background: 'var(--bg-secondary)', 
    borderRadius: 'var(--radius-lg)', 
    padding: '32px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  sectionTitle: { margin: 0, fontSize: '18px', fontWeight: '700' },
  addButton: {
    background: 'var(--accent-primary-alpha)',
    color: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  card: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: '600' },
  cardActions: { display: 'flex', gap: '8px' },
  textBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#4dabf7',
    padding: '4px 8px',
    transition: '0.2s',
    borderRadius: '4px'
  },
  textBtnDelete: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ff4d4f',
    padding: '4px 8px',
    transition: '0.2s',
    borderRadius: '4px'
  },
  progressSection: {
    marginBottom: '24px'
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    fontWeight: '600'
  },
  progressBarBg: {
    height: '6px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'var(--accent-primary)',
    borderRadius: '3px',
    transition: 'width 0.3s ease'
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '16px'
  },
  statCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statLabel: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' },
  statValue: { fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' },
  statSub: { fontSize: '12px', color: 'var(--text-tertiary)' },
  
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0' },
  th: { 
    textAlign: 'left', 
    padding: '16px', 
    fontSize: '12px', 
    fontWeight: '700', 
    color: 'var(--text-secondary)', 
    textTransform: 'uppercase', 
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  td: { 
    padding: '16px', 
    fontSize: '14px', 
    color: 'var(--text-primary)', 
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)' 
  },
  empty: { color: 'var(--text-tertiary)', fontSize: '15px', padding: '20px 0' },
  
  // Modals
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'var(--bg-secondary)',
    width: '100%',
    maxWidth: '500px',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '20px',
    cursor: 'pointer'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputRow: { display: 'flex', gap: '16px' },
  label: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', display: 'block' },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px'
  },
  submitBtn: {
    background: 'var(--accent-primary)',
    color: '#000',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '16px'
  },
  deleteModal: {
    background: '#1a1a1a',
    width: '100%',
    maxWidth: '340px',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
  },
  deleteModalTitle: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff'
  },
  deleteModalText: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  deleteModalActions: {
    display: 'flex',
    gap: '12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '16px'
  },
  cancelBtn: {
    flex: 1,
    background: 'transparent',
    color: '#4dabf7', // A softer blue matching modern iOS-like cancel
    border: 'none',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  deleteBtn: {
    flex: 1,
    background: 'transparent',
    color: '#ff4d4f', // Red matching the UI mockup
    border: 'none',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default ManageProgress;

import React, { useState, useEffect } from 'react';
import { workoutsAPI } from '../services/api';

const today = new Date().toISOString().split('T')[0];

const ExerciseModal = ({ exercise, onClose }) => {
  const [action, setAction] = useState(null); // 'log' | 'plan'
  const [logForm, setLogForm] = useState({
    date: today,
    duration_minutes: exercise.default_duration_minutes || '',
    rating: 3,
    notes: '',
  });
  const [planName, setPlanName] = useState(`${exercise.name} Plan`);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleLog = async e => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await workoutsAPI.createWorkoutLog({
        library_exercise_id: exercise.id,
        workout_name: exercise.name,
        date: logForm.date,
        duration_minutes: logForm.duration_minutes || null,
        rating: logForm.rating,
        notes: logForm.notes || null,
      });
      setSuccess('Activity logged!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log activity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToPlan = async e => {
    e.preventDefault();
    if (!planName.trim()) { setError('Plan name is required.'); return; }
    setError(''); setSubmitting(true);
    try {
      await workoutsAPI.createWorkoutPlan({
        name: planName.trim(),
        days: [{
          name: 'Day 1',
          day_number: 1,
          exercises: [{
            exercise_id: exercise.id,
            duration_minutes: exercise.default_duration_minutes || null,
          }],
        }],
      });
      setSuccess('Plan created!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, maxWidth: 460, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{exercise.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 20, lineHeight: 1, padding: '0 0 0 12px' }}>✕</button>
        </div>

        {exercise.description && <p className="muted-text" style={{ marginBottom: 12 }}>{exercise.description}</p>}

        <div className="flex flex-wrap gap-6" style={{ marginBottom: 20 }}>
          {exercise.muscle_group && <span className="badge badge-teal">{exercise.muscle_group}</span>}
          {exercise.equipment && <span className="badge badge-muted">{exercise.equipment}</span>}
          {exercise.difficulty && <span className="badge badge-blue">{exercise.difficulty}</span>}
          {exercise.category && <span className="badge badge-green">{exercise.category}</span>}
          {exercise.default_duration_minutes && <span className="badge badge-muted">{exercise.default_duration_minutes} min</span>}
        </div>

        {success ? (
          <div>
            <div className="success-message" style={{ marginBottom: 16 }}>{success}</div>
            <div className="flex gap-10">
              <button className="btn btn-ghost btn-sm" onClick={() => { setSuccess(''); setAction(null); }}>Do something else</button>
              <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <>
            {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}

            {!action && (
              <div className="flex gap-10">
                <button className="btn btn-primary" onClick={() => setAction('log')}>Log as activity</button>
                <button className="btn btn-ghost" onClick={() => setAction('plan')}>Add to new plan</button>
              </div>
            )}

            {action === 'log' && (
              <form onSubmit={handleLog} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
                  <div className="form-group w-full">
                    <label>Date</label>
                    <input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div className="form-group w-full">
                    <label>Duration (minutes)</label>
                    <input type="number" value={logForm.duration_minutes} min="1" placeholder="e.g. 30" onChange={e => setLogForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Rating: {logForm.rating}/5</label>
                  <div className="flex gap-8 mt-8">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setLogForm(f => ({ ...f, rating: n }))} style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: n <= logForm.rating ? 'var(--amber)' : 'var(--border-2)', padding: 0 }}>★</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea rows={2} value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="How did it go?" />
                </div>
                <div className="flex gap-10">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Logging…' : 'Log activity'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>Back</button>
                </div>
              </form>
            )}

            {action === 'plan' && (
              <form onSubmit={handleAddToPlan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Plan name</label>
                  <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} required />
                </div>
                <p className="muted-text" style={{ fontSize: 12, marginTop: -8 }}>
                  Creates a new plan with {exercise.name} as the first exercise.
                </p>
                <div className="flex gap-10">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Creating…' : 'Create plan'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>Back</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const BrowseExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const [page, setPage] = useState(1);
  const perPage = 6;

  const [activeExercise, setActiveExercise] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await workoutsAPI.getExercises();
        if (res?.data?.success) setExercises(res.data.data.exercises || []);
      } catch {
        setError('Failed to load exercises.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedMuscle, selectedEquipment, selectedDifficulty]);

  const muscleGroups = [...new Set(exercises.map(ex => ex.muscle_group).filter(Boolean))].sort();
  const equipmentOptions = [...new Set(exercises.map(ex => ex.equipment).filter(Boolean))].sort();
  const difficultyOptions = ['beginner', 'intermediate', 'advanced'];

  const filteredExercises = exercises.filter(ex => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedMuscle && ex.muscle_group !== selectedMuscle) return false;
    if (selectedEquipment && ex.equipment !== selectedEquipment) return false;
    if (selectedDifficulty && ex.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const startIndex = (page - 1) * perPage;
  const paginated = filteredExercises.slice(startIndex, startIndex + perPage);
  const totalPages = Math.ceil(filteredExercises.length / perPage);

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Exercise Library</p>
          <h1>Browse exercises</h1>
          <p className="page-copy">
            Explore exercises by muscle group, equipment, and difficulty.
          </p>
        </div>
      </div>

      <div className="card fade-up fade-up-1" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={selectedMuscle} onChange={(e) => setSelectedMuscle(e.target.value)}>
            <option value="">All Muscles</option>
            {muscleGroups.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={selectedEquipment} onChange={(e) => setSelectedEquipment(e.target.value)}>
            <option value="">All Equipment</option>
            {equipmentOptions.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
            <option value="">All Difficulty</option>
            {difficultyOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading exercises...</div>
      ) : filteredExercises.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>No exercises found</h3>
          <p className="muted-text">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="coach-grid fade-up fade-up-2">
            {paginated.map(ex => (
              <button
                key={ex.id}
                type="button"
                className="coach-card"
                onClick={() => setActiveExercise(ex)}
                style={{ textAlign: 'left', cursor: 'pointer', width: '100%', background: 'none', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <h3>{ex.name}</h3>
                {ex.description && <p className="muted-text">{ex.description}</p>}
                <div className="coach-specs">
                  {ex.muscle_group && <span className="badge badge-teal">{ex.muscle_group}</span>}
                  {ex.equipment && <span className="badge badge-muted">{ex.equipment}</span>}
                  {ex.difficulty && <span className="badge badge-blue">{ex.difficulty}</span>}
                  {ex.category && <span className="badge badge-green">{ex.category}</span>}
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-12">
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="muted-text">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {activeExercise && (
        <ExerciseModal exercise={activeExercise} onClose={() => setActiveExercise(null)} />
      )}
    </div>
  );
};

export default BrowseExercises;

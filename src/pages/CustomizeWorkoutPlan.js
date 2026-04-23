import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workoutsAPI } from '../services/api';

const CustomizeWorkoutPlan = () => {
  const navigate = useNavigate();
  const { planId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    metadata: {
      goal: '',
      difficulty: '',
      plan_type: '',
      duration_weeks: ''
    },
    days: [],
    original_plan_id: null
  });

  // Load existing plan
  useEffect(() => {
    const loadPlan = async () => {
      try {
        setLoading(true);

        const res = await workoutsAPI.getWorkoutPlan(planId);

        if (res?.data?.success) {
          const plan = res.data.data;

          setPlanForm({
            name: plan.title || plan.name || '',
            description: plan.description || '',
            start_date: plan.start_date || '',
            end_date: plan.end_date || '',
            metadata: {
              goal: plan.goal || plan.metadata?.goal || '',
              difficulty: plan.difficulty || plan.metadata?.difficulty || '',
              plan_type: plan.plan_type || plan.metadata?.plan_type || '',
              duration_weeks: plan.duration_weeks || plan.metadata?.duration_weeks || ''
            },
            days: plan.days || [],
            original_plan_id: plan.id
          });
        }
      } catch (err) {
        setError('Failed to load workout plan.');
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [planId]);

  const setMeta = (k, v) =>
    setPlanForm(f => ({
      ...f,
      metadata: {
        ...f.metadata,
        [k]: v
      }
    }));

  const addDay = () =>
    setPlanForm(f => ({
      ...f,
      days: [
        ...f.days,
        {
          name: `Day ${f.days.length + 1}`,
          day_number: f.days.length + 1,
          notes: '',
          exercises: []
        }
      ]
    }));

  const removeDay = (i) =>
    setPlanForm(f => ({
      ...f,
      days: f.days.filter((_, j) => j !== i)
    }));

  const updDay = (i, k, v) => {
    const d = [...planForm.days];
    d[i] = { ...d[i], [k]: v };
    setPlanForm(f => ({ ...f, days: d }));
  };

  const addEx = (i) => {
    const d = [...planForm.days];
    d[i].exercises.push({
      exercise_id: '',
      sets: 3,
      reps: '10',
      weight: 'bodyweight',
      rest_seconds: 60,
      notes: ''
    });
    setPlanForm(f => ({ ...f, days: d }));
  };

  const removeEx = (di, ei) => {
    const d = [...planForm.days];
    d[di].exercises = d[di].exercises.filter((_, j) => j !== ei);
    setPlanForm(f => ({ ...f, days: d }));
  };

  const updEx = (di, ei, k, v) => {
    const d = [...planForm.days];
    d[di].exercises[ei] = {
      ...d[di].exercises[ei],
      [k]: v
    };
    setPlanForm(f => ({ ...f, days: d }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...planForm,
        is_custom: true
      };

      const res = await workoutsAPI.createWorkoutPlan(payload);

      if (res?.data?.success) {
        setSuccess('Workout plan customized successfully!');

        setTimeout(() => {
          navigate('/my-workouts');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to customize plan.');
    }
  };

  if (loading) return <div className="loading">Loading plan…</div>;

  return (
    <div className="container page-shell">

      <div className="page-hero fade-up">
        <div className="flex justify-between items-center">
          <div>
            <p className="eyebrow">Client workspace</p>
            <h1>Customize workout plan</h1>
            <p className="page-copy">
              Adjust exercises, volume, and structure to match your goals.
            </p>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/my-workouts')}
          >
            ← Back
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* BASIC INFO */}
        <div className="card">
          <h2>Plan details</h2>

          <div className="form-group">
            <label>Plan name</label>
            <input
              value={planForm.name}
              onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={planForm.description}
              onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              type="date"
              value={planForm.start_date}
              onChange={e => setPlanForm(f => ({ ...f, start_date: e.target.value }))}
            />
            <input
              type="date"
              value={planForm.end_date}
              onChange={e => setPlanForm(f => ({ ...f, end_date: e.target.value }))}
            />
          </div>
        </div>

        {/* DAYS */}
        <div className="card">
          <div className="flex justify-between items-center">
            <h2>Workout structure</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addDay}>
              + Add day
            </button>
          </div>

          {planForm.days.map((day, di) => (
            <div key={di} style={{ marginTop: 16, padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>

              <div className="flex justify-between">
                <strong>{day.name}</strong>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeDay(di)}>
                  Remove
                </button>
              </div>

              <input
                value={day.name}
                onChange={e => updDay(di, 'name', e.target.value)}
                placeholder="Day name"
              />

              <textarea
                value={day.notes}
                onChange={e => updDay(di, 'notes', e.target.value)}
                placeholder="Notes"
              />

              <button type="button" className="btn btn-primary btn-sm" onClick={() => addEx(di)}>
                + Exercise
              </button>

              {day.exercises.map((ex, ei) => (
                <div key={ei} style={{ marginTop: 10 }}>

                  <input
                    placeholder="Exercise ID"
                    value={ex.exercise_id}
                    onChange={e => updEx(di, ei, 'exercise_id', e.target.value)}
                  />

                  <input
                    value={ex.sets}
                    onChange={e => updEx(di, ei, 'sets', e.target.value)}
                    placeholder="Sets"
                  />

                  <input
                    value={ex.reps}
                    onChange={e => updEx(di, ei, 'reps', e.target.value)}
                    placeholder="Reps"
                  />

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeEx(di, ei)}
                  >
                    Remove
                  </button>

                </div>
              ))}

            </div>
          ))}
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <button className="btn btn-primary">
            Save Customized Plan
          </button>
        </div>

      </form>
    </div>
  );
};

export default CustomizeWorkoutPlan;
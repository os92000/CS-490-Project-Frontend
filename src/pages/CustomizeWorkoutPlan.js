import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workoutsAPI } from '../services/api';

const emptyMetadata = {
  goal: '',
  difficulty: '',
  plan_type: ''
};

const emptyDay = (index, defaultDate = '') => ({
  name: `Day ${index + 1}`,
  day_number: index + 1,
  scheduled_date: defaultDate,
  repeat_weeks: 1,
  notes: '',
  exercises: []
});

const CustomizeWorkoutPlan = () => {
  const navigate = useNavigate();
  const { planId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exercises, setExercises] = useState([]);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active',
    metadata: { ...emptyMetadata },
    days: [],
    client_id: '',
    calendar_assignments: []
  });

  const shiftDate = (dateString, days) => {
    if (!dateString) return '';
    const next = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(next.getTime())) return '';
    next.setDate(next.getDate() + days);
    return next.toISOString().split('T')[0];
  };

  const assignmentsByDayId = useMemo(() => {
    const map = {};
    (planForm.calendar_assignments || []).forEach((assignment) => {
      if (!assignment?.workout_day_id) return;
      if (!map[assignment.workout_day_id]) map[assignment.workout_day_id] = [];
      map[assignment.workout_day_id].push(assignment);
    });
    return map;
  }, [planForm.calendar_assignments]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [planRes, exerciseRes] = await Promise.all([
          workoutsAPI.getWorkoutPlan(planId),
          workoutsAPI.getExercises(),
        ]);

        if (!mounted) return;

        if (exerciseRes?.data?.success) {
          setExercises(exerciseRes.data.data.exercises || []);
        }

        if (planRes?.data?.success && planRes.data.data) {
          const plan = planRes.data.data;
          const planAssignmentsByDayId = {};
          (plan.calendar_assignments || []).forEach((assignment) => {
            if (!assignment?.workout_day_id) return;
            if (!planAssignmentsByDayId[assignment.workout_day_id]) planAssignmentsByDayId[assignment.workout_day_id] = [];
            planAssignmentsByDayId[assignment.workout_day_id].push(assignment);
          });

          const days = (plan.days || []).map((day, index) => {
            const dayAssignments = planAssignmentsByDayId[day.id] || [];
            const repeatWeeks = dayAssignments.length > 0 ? dayAssignments.length : 1;
            const scheduledDate = dayAssignments[0]?.assigned_date || '';
            return {
              ...day,
              day_number: day.day_number || index + 1,
              scheduled_date: scheduledDate,
              repeat_weeks: repeatWeeks,
              exercises: (day.exercises || []).map((exercise) => ({
                exercise_id: exercise.exercise_id || exercise.exercise?.id || '',
                sets: exercise.sets || '',
                reps: exercise.reps || '',
                weight: exercise.weight || '',
                rest_seconds: exercise.rest_seconds || '',
                duration_minutes: exercise.duration_minutes || '',
                notes: exercise.notes || '',
                order: exercise.order || ''
              }))
            };
          });

          setPlanForm({
            name: plan.name || '',
            description: plan.description || '',
            start_date: plan.start_date || '',
            end_date: plan.end_date || '',
            status: plan.status || 'active',
            metadata: {
              goal: plan.goal || '',
              difficulty: plan.difficulty || '',
              plan_type: plan.plan_type || ''
            },
            days: days.length > 0 ? days : [emptyDay(0, plan.start_date || '')],
            client_id: plan.client_id || '',
            calendar_assignments: plan.calendar_assignments || []
          });
        } else {
          setError('Failed to load workout plan.');
        }
      } catch (err) {
        setError('Failed to load workout plan.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [planId]);

  const setMeta = (key, value) => {
    setPlanForm((form) => ({
      ...form,
      metadata: {
        ...form.metadata,
        [key]: value,
      },
    }));
  };

  const addDay = () => {
    setPlanForm((form) => {
      const previousDay = form.days[form.days.length - 1];
      const defaultDate = previousDay?.scheduled_date
        ? shiftDate(previousDay.scheduled_date, 7)
        : (form.start_date || '');

      return {
        ...form,
        days: [...form.days, emptyDay(form.days.length, defaultDate)],
      };
    });
  };

  const removeDay = (dayIndex) => {
    setPlanForm((form) => ({
      ...form,
      days: form.days.filter((_, index) => index !== dayIndex),
    }));
  };

  const updateDay = (dayIndex, key, value) => {
    setPlanForm((form) => {
      const nextDays = [...form.days];
      nextDays[dayIndex] = { ...nextDays[dayIndex], [key]: value };
      return { ...form, days: nextDays };
    });
  };

  const addExercise = (dayIndex) => {
    setPlanForm((form) => {
      const nextDays = [...form.days];
      const nextDay = { ...nextDays[dayIndex] };
      nextDay.exercises = [
        ...(nextDay.exercises || []),
        {
          exercise_id: exercises[0]?.id || '',
          sets: 3,
          reps: '10',
          weight: 'bodyweight',
          rest_seconds: 60,
          duration_minutes: '',
          notes: '',
          order: (nextDay.exercises || []).length + 1,
        },
      ];
      nextDays[dayIndex] = nextDay;
      return { ...form, days: nextDays };
    });
  };

  const removeExercise = (dayIndex, exerciseIndex) => {
    setPlanForm((form) => {
      const nextDays = [...form.days];
      const nextDay = { ...nextDays[dayIndex] };
      nextDay.exercises = (nextDay.exercises || []).filter((_, index) => index !== exerciseIndex);
      nextDays[dayIndex] = nextDay;
      return { ...form, days: nextDays };
    });
  };

  const updateExercise = (dayIndex, exerciseIndex, key, value) => {
    setPlanForm((form) => {
      const nextDays = [...form.days];
      const nextDay = { ...nextDays[dayIndex] };
      nextDay.exercises = (nextDay.exercises || []).map((exercise, index) => (
        index === exerciseIndex ? { ...exercise, [key]: value } : exercise
      ));
      nextDays[dayIndex] = nextDay;
      return { ...form, days: nextDays };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        ...planForm,
        goal: planForm.metadata.goal,
        difficulty: planForm.metadata.difficulty,
        plan_type: planForm.metadata.plan_type,
      };

      const res = await workoutsAPI.updateWorkoutPlan(planId, payload);
      if (res?.data?.success) {
        setSuccess('Workout plan updated successfully.');
        setTimeout(() => navigate('/my-workouts'), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workout plan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading plan…</div>;

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="flex justify-between items-center flex-wrap gap-16">
          <div className="hero-copy">
            <p className="eyebrow">Workout editor</p>
            <h1>Customize workout plan</h1>
            <p className="page-copy">Edit the plan, schedule specific dates, and rebuild the calendar assignments in one place.</p>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate('/my-workouts')}>← Back to plans</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card fade-up fade-up-1">
          <div className="section-header">
            <div>
              <h2>Plan details</h2>
              <p className="muted-text">Core settings and calendar range.</p>
            </div>
            <span className={`badge ${planForm.status === 'active' ? 'badge-green' : planForm.status === 'completed' ? 'badge-muted' : 'badge-amber'}`}>{planForm.status}</span>
          </div>

          <div className="form-group">
            <label>Plan name</label>
            <input
              value={planForm.name}
              onChange={(event) => setPlanForm((form) => ({ ...form, name: event.target.value }))}
              placeholder="e.g. 4-Week Strength Builder"
              required
            />
          </div>

          <div className="form-group mt-12">
            <label>Description</label>
            <textarea
              rows={2}
              value={planForm.description}
              onChange={(event) => setPlanForm((form) => ({ ...form, description: event.target.value }))}
              placeholder="Describe the goals and approach…"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginTop: 14 }}>
            <div className="form-group">
              <label>Start date</label>
              <input
                type="date"
                value={planForm.start_date}
                onChange={(event) => setPlanForm((form) => ({ ...form, start_date: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>End date</label>
              <input
                type="date"
                value={planForm.end_date}
                onChange={(event) => setPlanForm((form) => ({ ...form, end_date: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={planForm.status}
                onChange={(event) => setPlanForm((form) => ({ ...form, status: event.target.value }))}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group">
              <label>Goal</label>
              <input
                value={planForm.metadata.goal}
                onChange={(event) => setMeta('goal', event.target.value)}
                placeholder="Fat loss, strength…"
              />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={planForm.metadata.difficulty}
                onChange={(event) => setMeta('difficulty', event.target.value)}
              >
                <option value="">Select</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label>Plan type</label>
              <input
                value={planForm.metadata.plan_type}
                onChange={(event) => setMeta('plan_type', event.target.value)}
                placeholder="Full body, split…"
              />
            </div>
          </div>
        </div>

        <div className="card fade-up fade-up-2">
          <div className="section-header">
            <div>
              <h2>Workout days</h2>
              <p className="muted-text">Add days, assign dates, and repeat them weekly when needed.</p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addDay}>
              + Add day
            </button>
          </div>

          {planForm.days.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>💪</p>
              <p className="muted-text">No workout days yet. Click "+ Add day" to build the plan.</p>
            </div>
          ) : planForm.days.map((day, dayIndex) => {
            const calendarAssignments = assignmentsByDayId[day.id] || [];
            return (
              <div key={day.id || dayIndex} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
                <div className="flex justify-between items-center mb-12">
                  <h3 style={{ color: 'var(--green)' }}>Day {dayIndex + 1}</h3>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeDay(dayIndex)}>Remove day</button>
                </div>

                <div className="flex gap-12 mb-12" style={{ flexWrap: 'wrap' }}>
                  <div className="form-group w-full">
                    <label>Day name</label>
                    <input
                      value={day.name}
                      onChange={(event) => updateDay(dayIndex, 'name', event.target.value)}
                      placeholder="e.g. Upper Body, Leg Day"
                    />
                  </div>
                  <div className="form-group">
                    <label>Scheduled date</label>
                    <input
                      type="date"
                      value={day.scheduled_date || ''}
                      onChange={(event) => updateDay(dayIndex, 'scheduled_date', event.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Repeat weekly</label>
                    <input
                      type="number"
                      min="1"
                      value={day.repeat_weeks || 1}
                      onChange={(event) => updateDay(dayIndex, 'repeat_weeks', event.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="form-group w-full">
                    <label>Notes</label>
                    <textarea
                      rows={2}
                      value={day.notes || ''}
                      onChange={(event) => updateDay(dayIndex, 'notes', event.target.value)}
                      placeholder="Instructions for this day…"
                    />
                  </div>
                </div>

                <p className="muted-text" style={{ fontSize: 12, marginTop: -4, marginBottom: 12 }}>
                  {day.repeat_weeks > 1
                    ? `This day is scheduled ${day.repeat_weeks} times on the calendar.`
                    : 'Set a date to place this workout on the calendar.'}
                </p>

                {calendarAssignments.length > 0 && (
                  <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                    <strong style={{ display: 'block', marginBottom: 6 }}>Calendar entries</strong>
                    <div className="flex flex-wrap gap-6">
                      {calendarAssignments.map((assignment) => (
                        <span key={assignment.id} className="badge badge-teal">{assignment.assigned_date}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-10">
                  <strong style={{ fontSize: 13, color: 'var(--text-2)' }}>Exercises ({(day.exercises || []).length})</strong>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => addExercise(dayIndex)}>+ Add exercise</button>
                </div>

                {(day.exercises || []).length === 0 ? (
                  <p className="muted-text" style={{ fontSize: 13, fontStyle: 'italic' }}>No exercises yet.</p>
                ) : day.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                    <div className="flex justify-between items-center mb-10">
                      <div className="form-group w-full" style={{ marginBottom: 0 }}>
                        <label>Exercise</label>
                        <select
                          value={exercise.exercise_id}
                          onChange={(event) => updateExercise(dayIndex, exerciseIndex, 'exercise_id', event.target.value)}
                        >
                          <option value="">Select an exercise</option>
                          {exercises.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </div>
                      <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 10, alignSelf: 'flex-end' }} onClick={() => removeExercise(dayIndex, exerciseIndex)}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                      <div className="form-group"><label>Sets</label><input type="number" value={exercise.sets} onChange={(event) => updateExercise(dayIndex, exerciseIndex, 'sets', event.target.value)} /></div>
                      <div className="form-group"><label>Reps</label><input value={exercise.reps} onChange={(event) => updateExercise(dayIndex, exerciseIndex, 'reps', event.target.value)} placeholder="10-12" /></div>
                      <div className="form-group"><label>Weight</label><input value={exercise.weight} onChange={(event) => updateExercise(dayIndex, exerciseIndex, 'weight', event.target.value)} placeholder="20kg" /></div>
                      <div className="form-group"><label>Rest (sec)</label><input type="number" value={exercise.rest_seconds} onChange={(event) => updateExercise(dayIndex, exerciseIndex, 'rest_seconds', event.target.value)} /></div>
                    </div>
                    <div className="form-group mt-8"><label>Notes</label><input value={exercise.notes} onChange={(event) => updateExercise(dayIndex, exerciseIndex, 'notes', event.target.value)} placeholder="Exercise instructions…" /></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center flex-wrap gap-10 fade-up">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/my-workouts')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save customized plan'}</button>
        </div>
      </form>
    </div>
  );
};

export default CustomizeWorkoutPlan;

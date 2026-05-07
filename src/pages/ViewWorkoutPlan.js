import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workoutsAPI } from '../services/api';

const ViewWorkoutPlan = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadPlan = async () => {
      try {
        setLoading(true);
        const res = await workoutsAPI.getWorkoutPlan(planId);
        if (!mounted) return;
        if (res?.data?.success) {
          setPlan(res.data.data);
        } else {
          setError('Failed to load workout plan.');
        }
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to load workout plan.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPlan();
    return () => { mounted = false; };
  }, [planId]);

  const assignmentsByDay = useMemo(() => {
    const map = {};
    (plan?.calendar_assignments || []).forEach((assignment) => {
      if (!assignment?.workout_day_id) return;
      if (!map[assignment.workout_day_id]) map[assignment.workout_day_id] = [];
      map[assignment.workout_day_id].push(assignment);
    });
    return map;
  }, [plan]);

  if (loading) return <div className="loading">Loading workout plan…</div>;
  if (error) return <div className="container page-shell"><div className="error-message">{error}</div></div>;
  if (!plan) return null;

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="flex justify-between items-center flex-wrap gap-16">
          <div className="hero-copy">
            <p className="eyebrow">Workout plan</p>
            <h1>{plan.name || 'Workout plan'}</h1>
            {plan.description && <p className="page-copy">{plan.description}</p>}
          </div>
          <div className="flex gap-10 flex-wrap">
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate('/my-workouts')}>← Back to plans</button>
          </div>
        </div>
      </div>

      <div className="card fade-up fade-up-1">
        <div className="section-header">
          <div>
            <h2>Plan overview</h2>
            <p className="muted-text">Read-only detailed view with the full schedule and exercise structure.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          {plan.goal && <span className="badge badge-green">{plan.goal}</span>}
          {plan.difficulty && <span className="badge badge-amber">{plan.difficulty}</span>}
          {plan.plan_type && <span className="badge badge-teal">{plan.plan_type}</span>}
          {plan.start_date && <span className="badge badge-blue">Starts {plan.start_date}</span>}
          {plan.end_date && <span className="badge badge-blue">Ends {plan.end_date}</span>}
          {plan.status && <span className="badge badge-muted">{plan.status}</span>}
        </div>

        {plan.client && (
          <div style={{ marginTop: 14 }}>
            <strong style={{ display: 'block', marginBottom: 6 }}>Assigned client</strong>
            <span className="muted-text">{plan.client.profile?.first_name ? `${plan.client.profile.first_name} ${plan.client.profile.last_name || ''}`.trim() : plan.client.email}</span>
          </div>
        )}
      </div>

      <div className="two-col fade-up fade-up-2">
        <div className="card">
          <div className="section-header">
            <div>
              <h2>Workout days</h2>
              <p className="muted-text">Scheduled dates and exercise blocks.</p>
            </div>
          </div>

          {plan.days && plan.days.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {plan.days.map((day, index) => (
                <div key={day.id || index} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--bg-3)' }}>
                  <div className="flex justify-between items-start gap-10" style={{ flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontSize: 16 }}>{day.name || `Day ${day.day_number || index + 1}`}</strong>
                      {day.notes && <p className="muted-text" style={{ fontSize: 13, marginTop: 4 }}>{day.notes}</p>}
                    </div>
                    <div className="flex flex-wrap gap-6">
                      {day.scheduled_date && <span className="badge badge-blue">{day.scheduled_date}</span>}
                      {day.repeat_weeks && day.repeat_weeks > 1 && <span className="badge badge-muted">Repeats {day.repeat_weeks} weeks</span>}
                    </div>
                  </div>

                  {assignmentsByDay[day.id] && assignmentsByDay[day.id].length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p className="muted-text" style={{ fontSize: 12, marginBottom: 6 }}>Calendar entries</p>
                      <div className="flex flex-wrap gap-6">
                        {assignmentsByDay[day.id].map((assignment) => (
                          <span key={assignment.id} className="badge badge-blue">{assignment.assigned_date}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.exercises && day.exercises.length > 0 ? (
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div key={exercise.id || exerciseIndex} className="stack-card">
                          <div className="flex justify-between items-start gap-8" style={{ flexWrap: 'wrap' }}>
                            <div>
                              <strong style={{ display: 'block', marginBottom: 4 }}>{exercise.exercise?.name || 'Exercise'}</strong>
                              <span className="muted-text" style={{ fontSize: 12 }}>
                                {exercise.exercise?.muscle_group || 'Any muscle group'}
                                {exercise.exercise?.category ? ` · ${exercise.exercise.category}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-6">
                              {exercise.sets && <span className="badge badge-muted">{exercise.sets} sets</span>}
                              {exercise.reps && <span className="badge badge-muted">{exercise.reps} reps</span>}
                              {exercise.duration_minutes && <span className="badge badge-muted">{exercise.duration_minutes} min</span>}
                              {exercise.rest_seconds && <span className="badge badge-muted">{exercise.rest_seconds} sec rest</span>}
                              {exercise.weight && <span className="badge badge-teal">{exercise.weight}</span>}
                            </div>
                          </div>
                          {exercise.notes && <p className="muted-text" style={{ marginTop: 8, fontSize: 13 }}>{exercise.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted-text" style={{ fontSize: 13, marginTop: 12 }}>No exercises assigned.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">No workout days found for this plan.</p>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <h2>Plan summary</h2>
              <p className="muted-text">All available metadata in one place.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div className="stack-card">
              <span className="panel-label">Goal</span>
              <strong className="panel-value">{plan.goal || 'Not set'}</strong>
            </div>
            <div className="stack-card">
              <span className="panel-label">Difficulty</span>
              <strong className="panel-value">{plan.difficulty || 'Not set'}</strong>
            </div>
            <div className="stack-card">
              <span className="panel-label">Plan type</span>
              <strong className="panel-value">{plan.plan_type || 'Not set'}</strong>
            </div>
            <div className="stack-card">
              <span className="panel-label">Duration</span>
              <strong className="panel-value">{plan.duration_weeks ? `${plan.duration_weeks} weeks` : 'Not set'}</strong>
            </div>
            <div className="stack-card">
              <span className="panel-label">Dates</span>
              <strong className="panel-value">{plan.start_date || 'No start'} to {plan.end_date || 'No end'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewWorkoutPlan;

import React, { useEffect, useMemo, useState } from 'react';
import { workoutsAPI } from '../services/api';

// ---------- date helpers (all local-time, no TZ surprises) ----------
const pad = n => String(n).padStart(2, '0');
const toISODate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISODate = s => {
  // s is "YYYY-MM-DD"; construct as LOCAL date so day cells line up
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addMonths = (d, delta) => new Date(d.getFullYear(), d.getMonth() + delta, 1);
const monthLabel = d => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Build a 6-row (42 cell) grid for the given month
const buildMonthGrid = anchor => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = first.getDay(); // 0 = Sunday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
};

const Calendar = () => {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [assignments, setAssignments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assign form
  const [assignForm, setAssignForm] = useState({ plan_id: '', workout_day_id: '' });

  // Subscription / share panel
  const [showShare, setShowShare] = useState(false);
  const [feed, setFeed] = useState(null);
  const [copied, setCopied] = useState('');

  // ---- data load ----
  const loadMonth = async target => {
    try {
      setLoading(true);
      const [cal, pl] = await Promise.all([
        workoutsAPI.getWorkoutCalendar({
          year: target.getFullYear(),
          month: target.getMonth() + 1,
        }),
        workoutsAPI.getWorkoutPlans().catch(() => null),
      ]);
      if (cal?.data?.success) {
        setAssignments(cal.data.data.assignments || []);
        setLogs(cal.data.data.logs || []);
      }
      if (pl?.data?.success) setPlans(pl.data.data.plans || []);
    } catch {
      setError('Failed to load calendar data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonth(anchor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  // ---- derived lookups keyed by YYYY-MM-DD ----
  const assignmentsByDay = useMemo(() => {
    const m = new Map();
    assignments.forEach(a => {
      const key = a.assigned_date;
      if (!key) return;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(a);
    });
    return m;
  }, [assignments]);

  const logsByDay = useMemo(() => {
    const m = new Map();
    logs.forEach(l => {
      const key = l.date;
      if (!key) return;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(l);
    });
    return m;
  }, [logs]);

  const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);

  // ---- stats for the visible month ----
  const stats = useMemo(() => {
    const visibleStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const visibleEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const inMonth = isoStr => {
      if (!isoStr) return false;
      const d = parseISODate(isoStr);
      return d >= visibleStart && d <= visibleEnd;
    };
    const monthLogs = logs.filter(l => inMonth(l.date));
    const monthAssignments = assignments.filter(a => inMonth(a.assigned_date));
    const completed = monthLogs.filter(l => l.completed !== false).length;
    const upcoming = monthAssignments.filter(a => parseISODate(a.assigned_date) >= today).length;
    const minutes = monthLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
    return { completed, upcoming, minutes, scheduled: monthAssignments.length };
  }, [logs, assignments, anchor, today]);

  // ---- actions ----
  const goPrev = () => setAnchor(d => addMonths(d, -1));
  const goNext = () => setAnchor(d => addMonths(d, 1));
  const goToday = () => {
    const a = new Date(today.getFullYear(), today.getMonth(), 1);
    setAnchor(a);
    setSelected(today);
  };

  const selectedKey = toISODate(selected);
  const selectedAssignments = assignmentsByDay.get(selectedKey) || [];
  const selectedLogs = logsByDay.get(selectedKey) || [];

  const selectedPlan = plans.find(p => String(p.id) === String(assignForm.plan_id));
  const selectedPlanDays = selectedPlan?.days || selectedPlan?.workout_days || [];

  const handleAssign = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!assignForm.plan_id) {
      setError('Pick a workout plan first.');
      return;
    }
    try {
      await workoutsAPI.createAssignment({
        plan_id: Number(assignForm.plan_id),
        workout_day_id: assignForm.workout_day_id ? Number(assignForm.workout_day_id) : null,
        assigned_date: selectedKey,
      });
      setSuccess(`Scheduled on ${selected.toLocaleDateString()}`);
      setAssignForm({ plan_id: '', workout_day_id: '' });
      loadMonth(anchor);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule workout.');
    }
  };

  const handleUnassign = async assignmentId => {
    setError('');
    setSuccess('');
    try {
      await workoutsAPI.deleteAssignment(assignmentId);
      setSuccess('Removed from calendar.');
      loadMonth(anchor);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove assignment.');
    }
  };

  // ---- sync / export ----
  const openShare = async () => {
    setShowShare(true);
    if (feed) return;
    try {
      const res = await workoutsAPI.getCalendarFeedInfo();
      if (res?.data?.success) setFeed(res.data.data);
    } catch {
      setError('Could not load calendar feed info. Please try again.');
    }
  };

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  };

  const downloadIcs = async () => {
    try {
      const res = await workoutsAPI.downloadIcs();
      const blob = new Blob([res.data], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fitapp-workouts.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download .ics file.');
    }
  };

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="flex justify-between items-center flex-wrap gap-16">
          <div className="hero-copy">
            <p className="eyebrow">Planning</p>
            <h1>Workout Calendar</h1>
            <p className="page-copy">
              Schedule your training, track what you completed, and sync everything to Apple,
              Google, or Outlook.
            </p>
          </div>
          <div className="flex gap-8 flex-wrap">
            <button className="btn btn-ghost" onClick={goToday}>Today</button>
            <button className="btn btn-primary" onClick={openShare}>Sync to calendar app</button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* STATS */}
      <div className="stats-grid fade-up fade-up-1">
        {[
          { label: 'Scheduled this month', value: stats.scheduled },
          { label: 'Upcoming sessions', value: stats.upcoming },
          { label: 'Completed', value: stats.completed },
          { label: 'Minutes trained', value: stats.minutes },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
          </div>
        ))}
      </div>

      {/* CALENDAR + SIDE PANEL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.1fr) minmax(280px,1fr)', gap: 20, alignItems: 'start' }} className="calendar-layout fade-up fade-up-2">
        {/* Calendar card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Month nav */}
          <div className="flex items-center justify-between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-12">
              <button className="btn btn-ghost btn-sm" onClick={goPrev} aria-label="Previous month">‹</button>
              <h2 style={{ fontSize: 20, margin: 0 }}>{monthLabel(anchor)}</h2>
              <button className="btn btn-ghost btn-sm" onClick={goNext} aria-label="Next month">›</button>
            </div>
            {loading && <span className="muted-text" style={{ fontSize: 12 }}>Loading…</span>}
          </div>

          {/* Weekday header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            {weekdayShort.map(w => (
              <div key={w} style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(92px, auto)' }}>
            {grid.map((d, i) => {
              const key = toISODate(d);
              const inMonth = d.getMonth() === anchor.getMonth();
              const isToday = sameDay(d, today);
              const isSelected = sameDay(d, selected);
              const dayAssignments = assignmentsByDay.get(key) || [];
              const dayLogs = logsByDay.get(key) || [];
              const hasEvents = dayAssignments.length + dayLogs.length > 0;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d)}
                  style={{
                    position: 'relative',
                    textAlign: 'left',
                    padding: '8px 8px 6px',
                    background: isSelected
                      ? 'rgba(63,185,80,0.08)'
                      : inMonth
                        ? 'transparent'
                        : 'rgba(255,255,255,0.015)',
                    border: 'none',
                    borderRight: (i % 7) === 6 ? 'none' : '1px solid var(--border)',
                    borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
                    color: inMonth ? 'var(--text)' : 'var(--text-3)',
                    cursor: 'pointer',
                    transition: 'background var(--transition)',
                    minHeight: 92,
                    outline: isSelected ? '1px solid rgba(63,185,80,0.45)' : 'none',
                    outlineOffset: '-1px',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 500,
                        background: isToday ? 'var(--green)' : 'transparent',
                        color: isToday ? '#000' : 'inherit',
                      }}
                    >
                      {d.getDate()}
                    </span>
                    {hasEvents && !isToday && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                    )}
                  </div>

                  {/* Event pills (max 2 visible, +N indicator) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {dayAssignments.slice(0, 2).map(a => (
                      <span
                        key={`a-${a.id}`}
                        title={a.plan?.name || 'Workout'}
                        style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(57,208,180,0.18)',
                          color: 'var(--teal)',
                          border: '1px solid rgba(57,208,180,0.3)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500,
                        }}
                      >
                        💪 {a.plan?.name || 'Workout'}
                      </span>
                    ))}
                    {dayLogs.slice(0, Math.max(0, 2 - dayAssignments.length)).map(l => (
                      <span
                        key={`l-${l.id}`}
                        title={l.workout_name || 'Completed session'}
                        style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(63,185,80,0.15)',
                          color: 'var(--green)',
                          border: '1px solid rgba(63,185,80,0.3)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500,
                        }}
                      >
                        ✅ {l.workout_name || 'Session'}
                      </span>
                    ))}
                    {(dayAssignments.length + dayLogs.length) > 2 && (
                      <span style={{ fontSize: 10, color: 'var(--text-3)', paddingLeft: 2 }}>
                        +{dayAssignments.length + dayLogs.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel — selected day */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: 4 }}>
              {sameDay(selected, today) ? 'Today' : selected.toLocaleDateString(undefined, { weekday: 'long' })}
            </p>
            <h3 style={{ marginBottom: 16 }}>
              {selected.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>

            {/* Scheduled */}
            <p className="muted-text" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Scheduled
            </p>
            {selectedAssignments.length === 0 ? (
              <p className="muted-text" style={{ fontSize: 13, marginBottom: 14 }}>Nothing scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {selectedAssignments.map(a => (
                  <div key={a.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(57,208,180,0.3)', background: 'rgba(57,208,180,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        💪 {a.plan?.name || 'Workout'}
                      </div>
                      {a.workout_day?.name && (
                        <div className="muted-text" style={{ fontSize: 12 }}>{a.workout_day.name}</div>
                      )}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleUnassign(a.id)} title="Remove from calendar">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed */}
            <p className="muted-text" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Completed
            </p>
            {selectedLogs.length === 0 ? (
              <p className="muted-text" style={{ fontSize: 13, marginBottom: 14 }}>No sessions logged.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {selectedLogs.map(l => (
                  <div key={l.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(63,185,80,0.3)', background: 'rgba(63,185,80,0.08)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                      ✅ {l.workout_name || l.plan?.name || 'Session'}
                    </div>
                    <div className="muted-text" style={{ fontSize: 12 }}>
                      {l.duration_minutes ? `${l.duration_minutes} min` : ''}
                      {l.rating ? ` · ${'★'.repeat(l.rating)}` : ''}
                    </div>
                    {l.notes && <div className="muted-text" style={{ fontSize: 12, marginTop: 4 }}>{l.notes}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Quick-assign form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <p className="muted-text" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Schedule a plan
              </p>
              <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="form-group">
                  <label>Plan</label>
                  <select
                    value={assignForm.plan_id}
                    onChange={e => setAssignForm({ plan_id: e.target.value, workout_day_id: '' })}
                  >
                    <option value="">Select a plan…</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name || p.title}</option>
                    ))}
                  </select>
                </div>
                {selectedPlanDays.length > 0 && (
                  <div className="form-group">
                    <label>Day (optional)</label>
                    <select
                      value={assignForm.workout_day_id}
                      onChange={e => setAssignForm(f => ({ ...f, workout_day_id: e.target.value }))}
                    >
                      <option value="">Whole plan</option>
                      {selectedPlanDays.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={!assignForm.plan_id}>
                  + Schedule for {selected.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </button>
                {plans.length === 0 && (
                  <p className="muted-text" style={{ fontSize: 12 }}>
                    You don't have any workout plans yet. Create one in Workouts → Create plan.
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Legend */}
          <div className="card" style={{ padding: 16 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Legend</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div className="flex items-center gap-8">
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--teal)' }} />
                <span className="muted-text">Scheduled workout</span>
              </div>
              <div className="flex items-center gap-8">
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--green)' }} />
                <span className="muted-text">Completed session</span>
              </div>
              <div className="flex items-center gap-8">
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />
                <span className="muted-text">Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHARE / SYNC MODAL */}
      {showShare && (
        <div
          onClick={() => setShowShare(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="eyebrow">Calendar sync</p>
                <h2 style={{ marginTop: 2 }}>Add FitApp to your calendar</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowShare(false)}>✕</button>
            </div>
            <p className="muted-text" style={{ fontSize: 14, marginBottom: 16 }}>
              Subscribing keeps your workouts in sync automatically — new sessions appear in your
              calendar within an hour. Or download a one-time snapshot as an .ics file.
            </p>

            {!feed ? (
              <p className="muted-text">Generating your secure feed link…</p>
            ) : (
              <>
                {/* Quick-add buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
                  <a href={feed.webcal_url} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                    🍎 Apple Calendar
                  </a>
                  <a href={feed.google_calendar_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                    📅 Google Calendar
                  </a>
                  <a href={feed.outlook_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                    📨 Outlook
                  </a>
                  <button onClick={downloadIcs} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    ⬇ Download .ics
                  </button>
                </div>

                {/* Copy links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, display: 'block' }}>
                      Subscription URL (webcal)
                    </label>
                    <div className="flex gap-6">
                      <input readOnly value={feed.webcal_url} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-2)', fontSize: 12, fontFamily: 'monospace' }} />
                      <button className="btn btn-ghost btn-sm" onClick={() => copyText(feed.webcal_url, 'webcal')}>
                        {copied === 'webcal' ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, display: 'block' }}>
                      HTTPS feed URL
                    </label>
                    <div className="flex gap-6">
                      <input readOnly value={feed.feed_url} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-2)', fontSize: 12, fontFamily: 'monospace' }} />
                      <button className="btn btn-ghost btn-sm" onClick={() => copyText(feed.feed_url, 'https')}>
                        {copied === 'https' ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                    Manual setup instructions
                  </summary>
                  <ul style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, paddingLeft: 18 }}>
                    <li><strong>Apple Calendar:</strong> {feed.instructions?.apple}</li>
                    <li><strong>Google:</strong> {feed.instructions?.google}</li>
                    <li><strong>Outlook:</strong> {feed.instructions?.outlook}</li>
                    <li><strong>One-time import:</strong> {feed.instructions?.download}</li>
                  </ul>
                </details>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile: stack the grid */}
      <style>{`
        @media (max-width: 900px) {
          .calendar-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Calendar;

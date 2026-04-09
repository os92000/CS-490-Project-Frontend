import React, { useEffect, useMemo, useState } from 'react';
import { workoutsAPI } from '../services/api';

const MyWorkouts = () => {
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [calendar, setCalendar] = useState({ logs: [], plans: [] });
  const [exercises, setExercises] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [logFormVisible, setLogFormVisible] = useState(false);
  const [planFilter, setPlanFilter] = useState('');
  const [planFilters, setPlanFilters] = useState({
    goal: '',
    difficulty: '',
    plan_type: '',
    duration_weeks: '',
  });
  const [exerciseFilters, setExerciseFilters] = useState({
    search: '',
    category: '',
    muscle_group: '',
    difficulty: '',
    equipment: '',
  });
  const [templateFilters, setTemplateFilters] = useState({
    goal: '',
    difficulty: '',
    plan_type: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    plan_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
  });
  const [logForm, setLogForm] = useState({
    plan_id: '',
    workout_day_id: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    notes: '',
    rating: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadExercises();
  }, [exerciseFilters]);

  useEffect(() => {
    loadTemplates();
  }, [templateFilters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, logsRes, statsRes, calendarRes] = await Promise.all([
        workoutsAPI.getWorkoutPlans({ role: 'client' }),
        workoutsAPI.getWorkoutLogs(),
        workoutsAPI.getWorkoutStats({ period: 30 }),
        workoutsAPI.getWorkoutCalendar({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        }),
      ]);

      if (plansRes.data.success) setPlans(plansRes.data.data.plans);
      if (logsRes.data.success) setLogs(logsRes.data.data.logs);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (calendarRes.data.success) setCalendar(calendarRes.data.data);
      const templatesRes = await workoutsAPI.getTemplates();
      if (templatesRes.data.success) setTemplates(templatesRes.data.data.templates);
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const response = await workoutsAPI.getExercises(exerciseFilters);
      if (response.data.success) {
        setExercises(response.data.data.exercises);
      }
    } catch (error) {
      console.error('Error loading exercise inventory:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await workoutsAPI.getTemplates(templateFilters);
      if (response.data.success) {
        setTemplates(response.data.data.templates);
      }
    } catch (error) {
      console.error('Error loading workout templates:', error);
    }
  };

  const viewPlanDetails = async (planId) => {
    try {
      const response = await workoutsAPI.getWorkoutPlan(planId);
      if (response.data.success) {
        setSelectedPlan(response.data.data);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
    }
  };

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    try {
      const response = await workoutsAPI.createWorkoutLog(logForm);
      if (response.data.success) {
        setLogFormVisible(false);
        setLogForm({
          plan_id: '',
          workout_day_id: '',
          date: new Date().toISOString().split('T')[0],
          duration_minutes: '',
          notes: '',
          rating: 3,
        });
        loadData();
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout');
    }
  };

  const filteredPlans = useMemo(() => {
    if (!planFilter.trim()) return plans;
    const search = planFilter.toLowerCase();
    return plans.filter((plan) => {
      const matchesSearch =
        plan.name?.toLowerCase().includes(search) ||
        plan.description?.toLowerCase().includes(search) ||
        plan.status?.toLowerCase().includes(search);

      const matchesGoal = !planFilters.goal || plan.metadata?.goal?.toLowerCase().includes(planFilters.goal.toLowerCase());
      const matchesDifficulty = !planFilters.difficulty || plan.metadata?.difficulty === planFilters.difficulty;
      const matchesType = !planFilters.plan_type || plan.metadata?.plan_type?.toLowerCase().includes(planFilters.plan_type.toLowerCase());
      const matchesDuration = !planFilters.duration_weeks || `${plan.metadata?.duration_weeks || ''}` === `${planFilters.duration_weeks}`;

      return matchesSearch && matchesGoal && matchesDifficulty && matchesType && matchesDuration;
    });
  }, [plans, planFilter, planFilters]);

  const customizeTemplate = async (template) => {
    try {
      await workoutsAPI.customizeTemplate(template.id, {
        name: `${template.name} (Customized)`,
        goal: template.goal,
        difficulty: template.difficulty,
        plan_type: template.plan_type,
        duration_weeks: template.duration_weeks,
      });
      await loadData();
      setActiveTab('plans');
    } catch (error) {
      console.error('Error customizing template:', error);
      alert('Failed to customize template');
    }
  };

  const exerciseInsights = useMemo(() => {
    const categoryCounts = {};
    const difficultyCounts = {};
    const equipmentCounts = {};
    const muscleCounts = {};

    exercises.forEach((exercise) => {
      const category = exercise.category || 'uncategorized';
      const difficulty = exercise.difficulty || 'unspecified';
      const equipment = exercise.equipment || 'bodyweight';
      const muscle = exercise.muscle_group || 'general';

      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
      equipmentCounts[equipment] = (equipmentCounts[equipment] || 0) + 1;
      muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
    });

    const toEntries = (source, limit = null) => {
      const list = Object.entries(source)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
      return limit ? list.slice(0, limit) : list;
    };

    return {
      totalExercises: exercises.length,
      uniqueMuscles: Object.keys(muscleCounts).length,
      uniqueEquipment: Object.keys(equipmentCounts).length,
      beginnerFriendly: difficultyCounts.beginner || 0,
      categories: toEntries(categoryCounts),
      difficulties: toEntries(difficultyCounts),
      equipment: toEntries(equipmentCounts, 4),
      muscles: toEntries(muscleCounts, 5),
    };
  }, [exercises]);

  const maxCategoryCount = Math.max(...exerciseInsights.categories.map((item) => item.value), 1);
  const maxDifficultyCount = Math.max(...exerciseInsights.difficulties.map((item) => item.value), 1);
  const maxEquipmentCount = Math.max(...exerciseInsights.equipment.map((item) => item.value), 1);
  const maxMuscleCount = Math.max(...exerciseInsights.muscles.map((item) => item.value), 1);
  const topCategory = exerciseInsights.categories[0];
  const topDifficulty = exerciseInsights.difficulties[0];
  const topEquipment = exerciseInsights.equipment[0];

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading workouts...</p>
      </div>
    );
  }

  return (
    <div className="container page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Workouts</p>
          <h1>Plans, exercise inventory, training history, and monthly calendar</h1>
          <p className="page-copy">Browse assigned plans, review the exercise library, and keep your workout logging current.</p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><span>Total workouts</span><strong>{stats.total_workouts}</strong></div>
          <div className="stat-card"><span>Total time</span><strong>{stats.total_duration_minutes} min</strong></div>
          <div className="stat-card"><span>Average rating</span><strong>{stats.average_rating}/5</strong></div>
          <div className="stat-card"><span>Frequency</span><strong>{stats.workout_frequency_per_week}x/week</strong></div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setLogFormVisible(!logFormVisible)}>
          {logFormVisible ? 'Cancel' : 'Log Workout'}
        </button>
      </div>

      {logFormVisible && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Log Workout</h3>
          <form onSubmit={handleLogWorkout}>
            <div className="detail-grid">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={logForm.duration_minutes}
                  onChange={(e) => setLogForm({ ...logForm, duration_minutes: e.target.value })}
                  placeholder="e.g., 45"
                />
              </div>
              <div className="form-group">
                <label>Rating (1-5)</label>
                <select
                  value={logForm.rating}
                  onChange={(e) => setLogForm({ ...logForm, rating: parseInt(e.target.value, 10) })}
                >
                  <option value="1">1 - Very Hard</option>
                  <option value="2">2 - Hard</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Easy</option>
                  <option value="5">5 - Very Easy</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={logForm.notes}
                onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                rows="3"
                placeholder="How did you feel? Any achievements?"
              />
            </div>
            <button type="submit" className="btn btn-primary">Save Workout Log</button>
          </form>
        </div>
      )}

      <div className="tab-row">
        {['plans', 'history', 'inventory', 'templates', 'calendar'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <div>
          <div className="card">
            <div className="detail-grid">
              <div className="form-group">
                <label>Search</label>
                <input
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  placeholder="Search by plan name, description, or status"
                />
              </div>
              <div className="form-group">
                <label>Goal</label>
                <input value={planFilters.goal} onChange={(e) => setPlanFilters({ ...planFilters, goal: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select value={planFilters.difficulty} onChange={(e) => setPlanFilters({ ...planFilters, difficulty: e.target.value })}>
                  <option value="">All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Plan Type</label>
                <input value={planFilters.plan_type} onChange={(e) => setPlanFilters({ ...planFilters, plan_type: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Duration (weeks)</label>
                <input type="number" value={planFilters.duration_weeks} onChange={(e) => setPlanFilters({ ...planFilters, duration_weeks: e.target.value })} />
              </div>
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>
                No workout plans yet. Your coach will create one for you.
              </p>
            </div>
          ) : selectedPlan ? (
            <div className="card">
              <button onClick={() => setSelectedPlan(null)} className="btn btn-secondary" style={{ marginBottom: '15px' }}>
                Back to Plans
              </button>
              <h2>{selectedPlan.name}</h2>
              <p className="muted-text">{selectedPlan.description}</p>
              <p className="muted-text">
                {selectedPlan.start_date && `Start: ${selectedPlan.start_date}`}
                {selectedPlan.end_date && ` | End: ${selectedPlan.end_date}`}
              </p>

              {selectedPlan.days?.map((day) => (
                <div key={day.id} className="stack-card">
                  <h4>{day.name}</h4>
                  {day.notes && <p className="muted-text">{day.notes}</p>}
                  {day.exercises?.length > 0 && (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Exercise</th>
                            <th>Sets</th>
                            <th>Reps</th>
                            <th>Weight</th>
                            <th>Rest</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.exercises.map((exercise) => (
                            <tr key={exercise.id}>
                              <td>{exercise.exercise?.name || 'Exercise'}</td>
                              <td>{exercise.sets || '-'}</td>
                              <td>{exercise.reps || '-'}</td>
                              <td>{exercise.weight || '-'}</td>
                              <td>{exercise.rest_seconds ? `${exercise.rest_seconds}s` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewPlanDetails(plan.id)}>
                  <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>{plan.name}</h3>
                  <p className="muted-text">{plan.description}</p>
                  <div className="badge-group" style={{ marginTop: '10px' }}>
                    <span className="badge">{plan.status}</span>
                    {plan.metadata?.goal && <span className="badge">{plan.metadata.goal}</span>}
                    {plan.metadata?.difficulty && <span className="badge">{plan.metadata.difficulty}</span>}
                    {plan.metadata?.plan_type && <span className="badge">{plan.metadata.plan_type}</span>}
                    {plan.metadata?.duration_weeks && <span className="badge">{plan.metadata.duration_weeks} weeks</span>}
                    {plan.start_date && <span className="badge">Start {plan.start_date}</span>}
                    {plan.end_date && <span className="badge">End {plan.end_date}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {logs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>
                No workout logs yet. Start logging your workouts.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {logs.map((log) => (
                <div key={log.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ color: '#4CAF50', marginBottom: '5px' }}>
                        {log.workout_day?.name || 'Workout'}
                      </h4>
                      <p className="muted-text">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {log.duration_minutes && <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{log.duration_minutes} min</p>}
                      {log.rating && <p className="muted-text">Rating: {log.rating}/5</p>}
                    </div>
                  </div>
                  {log.notes && <p style={{ color: '#666', fontSize: '14px', marginTop: '10px', fontStyle: 'italic' }}>"{log.notes}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <div className="card section-intro-card">
            <div className="section-header">
              <div>
                <h2>Exercise Inventory</h2>
                <p className="muted-text">Explore your current exercise library and watch the visual summaries update as filters change.</p>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <span>Total exercises</span>
                <strong>{exerciseInsights.totalExercises}</strong>
              </div>
              <div className="stat-card">
                <span>Muscle groups</span>
                <strong>{exerciseInsights.uniqueMuscles}</strong>
              </div>
              <div className="stat-card">
                <span>Equipment types</span>
                <strong>{exerciseInsights.uniqueEquipment}</strong>
              </div>
              <div className="stat-card">
                <span>Beginner friendly</span>
                <strong>{exerciseInsights.beginnerFriendly}</strong>
              </div>
            </div>
            <div className="insight-orbit-grid">
              <div className="orbit-card">
                <div
                  className="orbit-chart orbit-chart-green"
                  style={{ '--orbit-angle': `${((topCategory?.value || 0) / maxCategoryCount) * 360}deg` }}
                >
                  <span>{topCategory?.value || 0}</span>
                </div>
                <div>
                  <strong>Top category</strong>
                  <p className="muted-text">{topCategory?.label || 'None yet'}</p>
                </div>
              </div>
              <div className="orbit-card">
                <div
                  className="orbit-chart orbit-chart-blue"
                  style={{ '--orbit-angle': `${((topDifficulty?.value || 0) / maxDifficultyCount) * 360}deg` }}
                >
                  <span>{topDifficulty?.value || 0}</span>
                </div>
                <div>
                  <strong>Top difficulty</strong>
                  <p className="muted-text">{topDifficulty?.label || 'None yet'}</p>
                </div>
              </div>
              <div className="orbit-card">
                <div
                  className="orbit-chart orbit-chart-warm"
                  style={{ '--orbit-angle': `${((topEquipment?.value || 0) / maxEquipmentCount) * 360}deg` }}
                >
                  <span>{topEquipment?.value || 0}</span>
                </div>
                <div>
                  <strong>Top equipment</strong>
                  <p className="muted-text">{topEquipment?.label || 'None yet'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="detail-grid">
              <div className="form-group">
                <label>Search</label>
                <input
                  value={exerciseFilters.search}
                  onChange={(e) => setExerciseFilters({ ...exerciseFilters, search: e.target.value })}
                  placeholder="Bench press, squat..."
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={exerciseFilters.category} onChange={(e) => setExerciseFilters({ ...exerciseFilters, category: e.target.value })}>
                  <option value="">All</option>
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="balance">Balance</option>
                  <option value="sports">Sports</option>
                </select>
              </div>
              <div className="form-group">
                <label>Muscle Group</label>
                <input
                  value={exerciseFilters.muscle_group}
                  onChange={(e) => setExerciseFilters({ ...exerciseFilters, muscle_group: e.target.value })}
                  placeholder="Chest, legs..."
                />
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select value={exerciseFilters.difficulty} onChange={(e) => setExerciseFilters({ ...exerciseFilters, difficulty: e.target.value })}>
                  <option value="">All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Equipment</label>
                <input
                  value={exerciseFilters.equipment}
                  onChange={(e) => setExerciseFilters({ ...exerciseFilters, equipment: e.target.value })}
                  placeholder="Dumbbells, barbell..."
                />
              </div>
            </div>
          </div>

          <div className="insight-board">
            <div className="card">
              <h3>Category spread</h3>
              {exerciseInsights.categories.length === 0 ? (
                <p className="muted-text">No exercises available for the current filters.</p>
              ) : (
                <div className="chart-list">
                  {exerciseInsights.categories.map((item) => (
                    <div key={item.label} className="chart-row">
                      <span>{item.label}</span>
                      <div className="chart-bar-track">
                        <div className="chart-bar-fill" style={{ width: `${(item.value / maxCategoryCount) * 100}%` }} />
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3>Difficulty mix</h3>
              {exerciseInsights.difficulties.length === 0 ? (
                <p className="muted-text">No exercise difficulty data available.</p>
              ) : (
                <div className="chart-list">
                  {exerciseInsights.difficulties.map((item) => (
                    <div key={item.label} className="chart-row">
                      <span>{item.label}</span>
                      <div className="chart-bar-track">
                        <div className="chart-bar-fill chart-bar-fill-secondary" style={{ width: `${(item.value / maxDifficultyCount) * 100}%` }} />
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="two-column-grid">
            <div className="card">
              <h3>Top equipment</h3>
              {exerciseInsights.equipment.length === 0 ? (
                <p className="muted-text">No equipment tags match the current filters.</p>
              ) : (
                <div className="chart-list">
                  {exerciseInsights.equipment.map((item) => (
                    <div key={item.label} className="chart-row">
                      <span>{item.label}</span>
                      <div className="chart-bar-track">
                        <div className="chart-bar-fill chart-bar-fill-dark" style={{ width: `${(item.value / maxEquipmentCount) * 100}%` }} />
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3>Top muscle groups</h3>
              {exerciseInsights.muscles.length === 0 ? (
                <p className="muted-text">No muscle-group data available.</p>
              ) : (
                <div className="chart-list">
                  {exerciseInsights.muscles.map((item) => (
                    <div key={item.label} className="chart-row">
                      <span>{item.label}</span>
                      <div className="chart-bar-track">
                        <div className="chart-bar-fill chart-bar-fill-warm" style={{ width: `${(item.value / maxMuscleCount) * 100}%` }} />
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {exercises.length === 0 ? (
            <div className="card text-center">
              <h3>No exercises found</h3>
              <p className="muted-text">Try clearing one or more filters to bring the inventory back into view.</p>
            </div>
          ) : (
            <div className="exercise-card-grid">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="card exercise-card">
                  <div className="exercise-card-header">
                    <h3>{exercise.name}</h3>
                    <span className="badge">{exercise.category || 'general'}</span>
                  </div>
                  <p className="muted-text">{exercise.description || 'No description available.'}</p>
                  <div className="badge-group exercise-badge-group">
                    <span className="badge">Muscle {exercise.muscle_group || '--'}</span>
                    <span className="badge">Equipment {exercise.equipment || '--'}</span>
                    <span className="badge">Difficulty {exercise.difficulty || '--'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div>
          <div className="card">
            <div className="detail-grid">
              <div className="form-group">
                <label>Goal</label>
                <input value={templateFilters.goal} onChange={(e) => setTemplateFilters({ ...templateFilters, goal: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select value={templateFilters.difficulty} onChange={(e) => setTemplateFilters({ ...templateFilters, difficulty: e.target.value })}>
                  <option value="">All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Plan Type</label>
                <input value={templateFilters.plan_type} onChange={(e) => setTemplateFilters({ ...templateFilters, plan_type: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {templates.length === 0 ? (
              <div className="card"><p className="muted-text">No approved workout templates available yet.</p></div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="card">
                  <h3>{template.name}</h3>
                  <p className="muted-text">{template.description}</p>
                  <div className="badge-group" style={{ marginTop: '10px' }}>
                    {template.goal && <span className="badge">{template.goal}</span>}
                    {template.difficulty && <span className="badge">{template.difficulty}</span>}
                    {template.plan_type && <span className="badge">{template.plan_type}</span>}
                    {template.duration_weeks && <span className="badge">{template.duration_weeks} weeks</span>}
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '14px' }} onClick={() => customizeTemplate(template)}>
                    Customize Template
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="two-column-grid">
          <div className="card">
            <h3>Assign plan to day</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                workoutsAPI.createAssignment(assignmentForm).then(loadData).catch(() => alert('Failed to assign workout'));
              }}
            >
              <div className="form-group">
                <label>Plan</label>
                <select value={assignmentForm.plan_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, plan_id: e.target.value })}>
                  <option value="">Select a plan</option>
                  {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={assignmentForm.assigned_date} onChange={(e) => setAssignmentForm({ ...assignmentForm, assigned_date: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary">Assign Plan</button>
            </form>
          </div>
          <div className="card">
            <h3>Active plans this month</h3>
            {calendar.plans?.length === 0 ? (
              <p className="muted-text">No active plans found.</p>
            ) : (
              calendar.plans.map((plan) => (
                <div key={plan.id} className="list-row">
                  <div>
                    <strong>{plan.name}</strong>
                    <p className="muted-text">{plan.start_date || 'No start date'} {plan.end_date ? `to ${plan.end_date}` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="card">
            <h3>Assignments this month</h3>
            {calendar.assignments?.length === 0 ? (
              <p className="muted-text">No explicit assignments this month.</p>
            ) : (
              calendar.assignments.map((assignment) => (
                <div key={assignment.id} className="list-row">
                  <div>
                    <strong>{assignment.assigned_date}</strong>
                    <p className="muted-text">{assignment.plan?.name}</p>
                  </div>
                  <button className="btn btn-danger" onClick={() => workoutsAPI.deleteAssignment(assignment.id).then(loadData)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="card">
            <h3>Completed workouts this month</h3>
            {calendar.logs?.length === 0 ? (
              <p className="muted-text">No workout logs this month.</p>
            ) : (
              calendar.logs.map((log) => (
                <div key={log.id} className="list-row">
                  <div>
                    <strong>{log.date}</strong>
                    <p className="muted-text">{log.duration_minutes || 0} minutes</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWorkouts;

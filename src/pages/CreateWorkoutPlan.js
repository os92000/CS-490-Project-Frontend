import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI, workoutsAPI } from '../services/api';

const CreateWorkoutPlan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    client_id: '',
    start_date: '',
    end_date: '',
    metadata: {
      goal: '',
      difficulty: '',
      plan_type: '',
      duration_weeks: '',
    },
    days: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load coach's clients
      const clientsRes = await coachesAPI.getMyClients();
      if (clientsRes.data.success) {
        const activeClients = clientsRes.data.data.clients.filter(c => c.status === 'active');
        setClients(activeClients);
      }

      // Load exercises
      const exercisesRes = await workoutsAPI.getExercises();
      if (exercisesRes.data.success) {
        setExercises(exercisesRes.data.data.exercises);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setErrorMessage('Failed to load data');
      setLoading(false);
    }
  };

  const addDay = () => {
    setPlanForm({
      ...planForm,
      days: [
        ...planForm.days,
        {
          name: `Day ${planForm.days.length + 1}`,
          day_number: planForm.days.length + 1,
          notes: '',
          exercises: []
        }
      ]
    });
  };

  const removeDay = (dayIndex) => {
    const newDays = planForm.days.filter((_, index) => index !== dayIndex);
    setPlanForm({ ...planForm, days: newDays });
  };

  const updateDay = (dayIndex, field, value) => {
    const newDays = [...planForm.days];
    newDays[dayIndex][field] = value;
    setPlanForm({ ...planForm, days: newDays });
  };

  const addExerciseToDay = (dayIndex) => {
    const newDays = [...planForm.days];
    newDays[dayIndex].exercises.push({
      exercise_id: exercises[0]?.id || '',
      sets: 3,
      reps: '10',
      weight: 'bodyweight',
      rest_seconds: 60,
      notes: ''
    });
    setPlanForm({ ...planForm, days: newDays });
  };

  const removeExerciseFromDay = (dayIndex, exerciseIndex) => {
    const newDays = [...planForm.days];
    newDays[dayIndex].exercises = newDays[dayIndex].exercises.filter((_, index) => index !== exerciseIndex);
    setPlanForm({ ...planForm, days: newDays });
  };

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    const newDays = [...planForm.days];
    newDays[dayIndex].exercises[exerciseIndex][field] = value;
    setPlanForm({ ...planForm, days: newDays });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!planForm.client_id) {
      setErrorMessage('Please select a client');
      return;
    }

    try {
      const response = await workoutsAPI.createWorkoutPlan(planForm);
      if (response.data.success) {
        setSuccessMessage('Workout plan created successfully!');
        setTimeout(() => {
          navigate('/my-clients');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating workout plan:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to create workout plan');
    }
  };

  const handleSaveTemplate = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!planForm.name || planForm.days.length === 0) {
      setErrorMessage('Add a name and at least one workout day before saving a template');
      return;
    }

    try {
      const response = await workoutsAPI.createTemplate({
        name: planForm.name,
        description: planForm.description,
        goal: planForm.metadata.goal,
        difficulty: planForm.metadata.difficulty,
        plan_type: planForm.metadata.plan_type,
        duration_weeks: planForm.metadata.duration_weeks,
        is_public: true,
        template_data: {
          days: planForm.days
        }
      });

      if (response.data.success) {
        setSuccessMessage('Workout template submitted for admin approval.');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to save workout template');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1000px', marginTop: '30px' }}>
      <h1>Create Workout Plan</h1>

      {successMessage && (
        <div className="card" style={{ backgroundColor: '#d4edda', borderColor: '#c3e6cb', marginBottom: '20px' }}>
          <p style={{ color: '#155724', margin: 0 }}>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="card" style={{ backgroundColor: '#f8d7da', borderColor: '#f5c6cb', marginBottom: '20px' }}>
          <p style={{ color: '#721c24', margin: 0 }}>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="card">
          <h3>Plan Details</h3>

          <div className="form-group">
            <label>Client *</label>
            <select
              className="input"
              value={planForm.client_id}
              onChange={(e) => setPlanForm({ ...planForm, client_id: e.target.value })}
              required
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.profile?.first_name || client.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Plan Name *</label>
            <input
              type="text"
              className="input"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g., 4-Week Strength Building"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="input"
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              rows="3"
              placeholder="Describe the goals and approach of this plan"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                className="input"
                value={planForm.start_date}
                onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                className="input"
                value={planForm.end_date}
                onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div className="form-group">
              <label>Goal</label>
              <input
                type="text"
                className="input"
                value={planForm.metadata.goal}
                onChange={(e) => setPlanForm({ ...planForm, metadata: { ...planForm.metadata, goal: e.target.value } })}
                placeholder="Fat loss, strength, endurance..."
              />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select
                className="input"
                value={planForm.metadata.difficulty}
                onChange={(e) => setPlanForm({ ...planForm, metadata: { ...planForm.metadata, difficulty: e.target.value } })}
              >
                <option value="">Select difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label>Plan Type</label>
              <input
                type="text"
                className="input"
                value={planForm.metadata.plan_type}
                onChange={(e) => setPlanForm({ ...planForm, metadata: { ...planForm.metadata, plan_type: e.target.value } })}
                placeholder="Strength split, full body..."
              />
            </div>
            <div className="form-group">
              <label>Duration (weeks)</label>
              <input
                type="number"
                className="input"
                value={planForm.metadata.duration_weeks}
                onChange={(e) => setPlanForm({ ...planForm, metadata: { ...planForm.metadata, duration_weeks: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* Workout Days */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Workout Days</h3>
            <button type="button" className="btn btn-primary" onClick={addDay}>
              + Add Day
            </button>
          </div>

          {planForm.days.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No workout days yet. Click "Add Day" to create your first workout day.
            </p>
          ) : (
            planForm.days.map((day, dayIndex) => (
              <div key={dayIndex} style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0 }}>Day {dayIndex + 1}</h4>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => removeDay(dayIndex)}
                    style={{ padding: '5px 15px' }}
                  >
                    Remove Day
                  </button>
                </div>

                <div className="form-group">
                  <label>Day Name</label>
                  <input
                    type="text"
                    className="input"
                    value={day.name}
                    onChange={(e) => updateDay(dayIndex, 'name', e.target.value)}
                    placeholder="e.g., Upper Body, Leg Day"
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    className="input"
                    value={day.notes}
                    onChange={(e) => updateDay(dayIndex, 'notes', e.target.value)}
                    rows="2"
                    placeholder="Instructions or notes for this day"
                  />
                </div>

                {/* Exercises */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', marginBottom: '10px' }}>
                    <strong>Exercises</strong>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => addExerciseToDay(dayIndex)}
                      style={{ padding: '5px 15px', fontSize: '14px' }}
                    >
                      + Add Exercise
                    </button>
                  </div>

                  {day.exercises.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '14px', fontStyle: 'italic' }}>No exercises added yet</p>
                  ) : (
                    day.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: '#888' }}>Exercise</label>
                            <select
                              className="input"
                              value={exercise.exercise_id}
                              onChange={(e) => updateExercise(dayIndex, exIndex, 'exercise_id', e.target.value)}
                              style={{ marginTop: '5px' }}
                            >
                              {exercises.map((ex) => (
                                <option key={ex.id} value={ex.id}>{ex.name}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExerciseFromDay(dayIndex, exIndex)}
                            style={{
                              marginLeft: '10px',
                              padding: '5px 10px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '12px', color: '#888' }}>Sets</label>
                            <input
                              type="number"
                              className="input"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', e.target.value)}
                              style={{ marginTop: '5px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', color: '#888' }}>Reps</label>
                            <input
                              type="text"
                              className="input"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(dayIndex, exIndex, 'reps', e.target.value)}
                              placeholder="e.g., 10-12"
                              style={{ marginTop: '5px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', color: '#888' }}>Weight</label>
                            <input
                              type="text"
                              className="input"
                              value={exercise.weight}
                              onChange={(e) => updateExercise(dayIndex, exIndex, 'weight', e.target.value)}
                              placeholder="e.g., 20kg"
                              style={{ marginTop: '5px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', color: '#888' }}>Rest (sec)</label>
                            <input
                              type="number"
                              className="input"
                              value={exercise.rest_seconds}
                              onChange={(e) => updateExercise(dayIndex, exIndex, 'rest_seconds', e.target.value)}
                              style={{ marginTop: '5px' }}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                          <label style={{ fontSize: '12px', color: '#888' }}>Notes</label>
                          <input
                            type="text"
                            className="input"
                            value={exercise.notes}
                            onChange={(e) => updateExercise(dayIndex, exIndex, 'notes', e.target.value)}
                            placeholder="Exercise-specific instructions"
                            style={{ marginTop: '5px' }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Submit */}
        <div style={{ textAlign: 'right' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveTemplate}
            style={{ marginRight: '10px' }}
          >
            Save as Template
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/my-clients')}
            style={{ marginRight: '10px' }}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Workout Plan
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWorkoutPlan;

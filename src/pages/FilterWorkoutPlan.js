import React, { useMemo, useState } from 'react';

/**
 * Client-side workout plan filtering component
 * Uses mock data for standalone demo/testing
 */

const MOCK_PLANS = [
  {
    id: 1,
    title: 'Beginner Fat Loss Plan',
    name: 'Beginner Fat Loss Plan',
    goal: 'fat loss',
    difficulty: 'beginner',
    duration_weeks: 4,
    plan_type: 'strength',
    description: 'A simple plan focused on burning fat and building consistency.'
  },
  {
    id: 2,
    title: 'Muscle Builder Intermediate',
    name: 'Muscle Builder Intermediate',
    goal: 'muscle gain',
    difficulty: 'intermediate',
    duration_weeks: 8,
    plan_type: 'hybrid',
    description: 'Balanced hypertrophy program for steady muscle growth.'
  },
  {
    id: 3,
    title: 'Advanced Strength Program',
    name: 'Advanced Strength Program',
    goal: 'strength',
    difficulty: 'advanced',
    duration_weeks: 12,
    plan_type: 'powerlifting',
    description: 'High intensity strength-focused training for experienced lifters.'
  },
  {
    id: 4,
    title: 'Endurance Conditioning',
    name: 'Endurance Conditioning',
    goal: 'endurance',
    difficulty: 'intermediate',
    duration_weeks: 6,
    plan_type: 'cardio',
    description: 'Improve stamina and cardiovascular performance.'
  }
];

const WorkoutPlanFilters = ({ onSelectPlan }) => {
  const [filters, setFilters] = useState({
    goal: '',
    difficulty: '',
    duration: '',
    type: ''
  });

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredPlans = useMemo(() => {
    return MOCK_PLANS.filter(plan => {
      const matchesGoal = filters.goal ? plan.goal === filters.goal : true;
      const matchesDifficulty = filters.difficulty ? plan.difficulty === filters.difficulty : true;
      const matchesType = filters.type ? plan.plan_type === filters.type : true;

      const matchesDuration = filters.duration
        ? (() => {
            const weeks = Number(plan.duration_weeks || 0);
            if (filters.duration === 'short') return weeks <= 4;
            if (filters.duration === 'medium') return weeks > 4 && weeks <= 8;
            if (filters.duration === 'long') return weeks > 8;
            return true;
          })()
        : true;

      return matchesGoal && matchesDifficulty && matchesType && matchesDuration;
    });
  }, [filters]);

  return (
    <div>

      {/* FILTER BAR */}
      <div className="card fade-up" style={{ marginBottom: 16 }}>
        <div className="flex flex-wrap gap-10">

          <div className="form-group">
            <label>Goal</label>
            <select value={filters.goal} onChange={(e) => updateFilter('goal', e.target.value)}>
              <option value="">All</option>
              <option value="fat loss">Fat Loss</option>
              <option value="muscle gain">Muscle Gain</option>
              <option value="strength">Strength</option>
              <option value="endurance">Endurance</option>
            </select>
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <select value={filters.difficulty} onChange={(e) => updateFilter('difficulty', e.target.value)}>
              <option value="">All</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label>Duration</label>
            <select value={filters.duration} onChange={(e) => updateFilter('duration', e.target.value)}>
              <option value="">All</option>
              <option value="short">Short (≤4 weeks)</option>
              <option value="medium">Medium (5–8 weeks)</option>
              <option value="long">Long (8+ weeks)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
              <option value="">All</option>
              <option value="strength">Strength</option>
              <option value="hybrid">Hybrid</option>
              <option value="powerlifting">Powerlifting</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFilters({ goal: '', difficulty: '', duration: '', type: '' })}
            >
              Reset
            </button>
          </div>

        </div>
      </div>

      {/* RESULTS */}
      <div className="coach-grid fade-up">
        {filteredPlans.map(plan => (
          <button
            key={plan.id}
            type="button"
            className="card"
            onClick={() => onSelectPlan?.(plan)}
            style={{ textAlign: 'left', cursor: 'pointer' }}
          >
            <div className="flex justify-between items-start mb-12">
              <h3>{plan.title}</h3>
              <span className="badge badge-muted">{plan.difficulty}</span>
            </div>

            <p className="muted-text" style={{ fontSize: 13, marginBottom: 10 }}>
              {plan.description}
            </p>

            <div className="flex flex-wrap gap-6">
              <span className="badge badge-green">{plan.goal}</span>
              <span className="badge badge-muted">{plan.duration_weeks} weeks</span>
              <span className="badge badge-teal">{plan.plan_type}</span>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
};

export default WorkoutPlanFilters;

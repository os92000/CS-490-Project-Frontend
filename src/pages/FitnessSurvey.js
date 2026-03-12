import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveysAPI } from '../services/api';

const FitnessSurvey = () => {
  const [formData, setFormData] = useState({
    fitness_level: '',
    primary_goal: '',
    experience_years: '',
    preferred_workout_type: '',
    equipment_access: '',
    workout_frequency: '',
    health_conditions: '',
    additional_notes: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!formData.fitness_level || !formData.primary_goal) {
      setError('Please fill in at least the fitness level and primary goal');
      setIsLoading(false);
      return;
    }

    try {
      const response = await surveysAPI.createFitnessSurvey(formData);

      if (response.data.success) {
        // Navigate to dashboard after successful survey submission
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Failed to submit survey');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container" style={{ maxWidth: '700px', marginTop: '50px' }}>
      <div className="card">
        <h1 className="text-center">Fitness Survey</h1>
        <p className="text-center" style={{ color: '#666', marginBottom: '30px' }}>
          Help us understand your fitness journey (optional)
        </p>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fitness_level">Fitness Level *</label>
            <select
              id="fitness_level"
              name="fitness_level"
              value={formData.fitness_level}
              onChange={handleChange}
              required
            >
              <option value="">Select fitness level</option>
              <option value="beginner">Beginner - Just starting out</option>
              <option value="intermediate">Intermediate - Regular exercise routine</option>
              <option value="advanced">Advanced - Highly experienced</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="primary_goal">Primary Goal *</label>
            <input
              type="text"
              id="primary_goal"
              name="primary_goal"
              value={formData.primary_goal}
              onChange={handleChange}
              placeholder="e.g., Lose weight, Build muscle, Improve endurance"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="experience_years">Years of Experience</label>
            <input
              type="number"
              id="experience_years"
              name="experience_years"
              value={formData.experience_years}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferred_workout_type">Preferred Workout Type</label>
            <input
              type="text"
              id="preferred_workout_type"
              name="preferred_workout_type"
              value={formData.preferred_workout_type}
              onChange={handleChange}
              placeholder="e.g., Weightlifting, Cardio, Yoga, CrossFit"
            />
          </div>

          <div className="form-group">
            <label htmlFor="equipment_access">Equipment Access</label>
            <select
              id="equipment_access"
              name="equipment_access"
              value={formData.equipment_access}
              onChange={handleChange}
            >
              <option value="">Select equipment access</option>
              <option value="home">Home gym</option>
              <option value="commercial">Commercial gym</option>
              <option value="minimal">Minimal equipment</option>
              <option value="none">No equipment</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="workout_frequency">Workout Frequency (per week)</label>
            <input
              type="number"
              id="workout_frequency"
              name="workout_frequency"
              value={formData.workout_frequency}
              onChange={handleChange}
              placeholder="3"
              min="0"
              max="7"
            />
          </div>

          <div className="form-group">
            <label htmlFor="health_conditions">Health Conditions or Injuries</label>
            <textarea
              id="health_conditions"
              name="health_conditions"
              value={formData.health_conditions}
              onChange={handleChange}
              placeholder="Please list any health conditions or injuries we should know about"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="additional_notes">Additional Notes</label>
            <textarea
              id="additional_notes"
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              placeholder="Any other information you'd like to share"
              rows="3"
            />
          </div>

          <div className="flex gap-10" style={{ justifyContent: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ minWidth: '150px' }}
            >
              {isLoading ? 'Submitting...' : 'Submit Survey'}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="btn"
              style={{
                backgroundColor: '#666',
                color: 'white',
                minWidth: '150px'
              }}
              disabled={isLoading}
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FitnessSurvey;

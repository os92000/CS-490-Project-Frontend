import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveysAPI } from '../services/api';

const FitnessSurvey = () => {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    fitness_level: '',
    goals: '',
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
    if (!formData.fitness_level || !formData.goals) {
      setError('Please fill in at least the fitness level and goals');
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
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
            />
          </div>

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
            <label htmlFor="goals">Goals *</label>
            <textarea
              id="goals"
              name="goals"
              value={formData.goals}
              onChange={handleChange}
              placeholder="e.g., Lose weight, build muscle, improve endurance"
              rows="3"
              required
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

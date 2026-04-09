import React, { useEffect, useMemo, useState } from 'react';
import { nutritionAPI } from '../services/api';

const today = new Date().toISOString().split('T')[0];

const Nutrition = () => {
  const [meals, setMeals] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [mealForm, setMealForm] = useState({ date: today, meal_type: 'breakfast', food_items: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' });
  const [mealPlanDraft, setMealPlanDraft] = useState({ title: '', notes: '' });
  const [dailyMetricForm, setDailyMetricForm] = useState({ date: today, steps: '', calories_burned: '', water_intake_ml: '', notes: '' });
  const [bodyMetricForm, setBodyMetricForm] = useState({ date: today, weight_kg: '', body_fat_percentage: '', waist_cm: '', notes: '' });
  const [wellnessForm, setWellnessForm] = useState({ date: today, mood: 'good', energy_level: 6, stress_level: 4, sleep_hours: '', sleep_quality: 'good', water_intake_ml: '', notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mealsRes, mealPlansRes, dailyRes, bodyRes, wellnessRes] = await Promise.all([
        nutritionAPI.getMeals(),
        nutritionAPI.getMealPlans(),
        nutritionAPI.getDailyMetrics(),
        nutritionAPI.getMetrics(),
        nutritionAPI.getWellness(),
      ]);
      if (mealsRes.data.success) setMeals(mealsRes.data.data.meals);
      if (mealPlansRes.data.success) setMealPlans(mealPlansRes.data.data.meal_plans);
      if (dailyRes.data.success) setDailyMetrics(dailyRes.data.data.daily_metrics);
      if (bodyRes.data.success) setBodyMetrics(bodyRes.data.data.metrics);
      if (wellnessRes.data.success) setWellnessLogs(wellnessRes.data.data.wellness);
    } catch (err) {
      setError('Failed to load nutrition data.');
    } finally {
      setLoading(false);
    }
  };

  const latestDailyMetric = dailyMetrics[0];
  const latestBodyMetric = bodyMetrics[0];
  const latestWellness = wellnessLogs[0];
  const todayMeals = useMemo(() => meals.filter((meal) => meal.date === today), [meals]);
  const caloriesToday = todayMeals.reduce((total, meal) => total + (meal.calories || 0), 0);

  const saveMeal = async (e) => {
    e.preventDefault();
    try {
      await nutritionAPI.createMeal(mealForm);
      setMealForm({ date: today, meal_type: 'breakfast', food_items: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' });
      setSuccessMessage('Meal saved.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save meal.');
    }
  };

  const saveDailyMetric = async (e) => {
    e.preventDefault();
    try {
      await nutritionAPI.createDailyMetric(dailyMetricForm);
      setDailyMetricForm({ date: today, steps: '', calories_burned: '', water_intake_ml: '', notes: '' });
      setSuccessMessage('Daily metrics saved.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save daily metrics.');
    }
  };

  const saveBodyMetric = async (e) => {
    e.preventDefault();
    try {
      await nutritionAPI.createMetric(bodyMetricForm);
      setBodyMetricForm({ date: today, weight_kg: '', body_fat_percentage: '', waist_cm: '', notes: '' });
      setSuccessMessage('Body metrics saved.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save body metrics.');
    }
  };

  const saveWellness = async (e) => {
    e.preventDefault();
    try {
      await nutritionAPI.createWellness(wellnessForm);
      setWellnessForm({ date: today, mood: 'good', energy_level: 6, stress_level: 4, sleep_hours: '', sleep_quality: 'good', water_intake_ml: '', notes: '' });
      setSuccessMessage('Wellness saved.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save wellness.');
    }
  };

  const saveMealPlan = async (e) => {
    e.preventDefault();
    try {
      await nutritionAPI.createMealPlan(mealPlanDraft);
      setMealPlanDraft({ title: '', notes: '' });
      setSuccessMessage('Meal plan saved.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save meal plan.');
    }
  };

  if (loading) {
    return <div className="loading">Loading nutrition dashboard...</div>;
  }

  return (
    <div className="container page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Nutrition & Wellness</p>
          <h1>Daily nutrition, metrics, meal plans, and mood tracking</h1>
          <p className="page-copy">Track meals, steps, water, body measurements, and daily wellness from one place.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="tab-row">
        {['overview', 'meals', 'metrics', 'wellness', 'meal-plans'].map((tab) => (
          <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><span>Calories today</span><strong>{caloriesToday}</strong></div>
            <div className="stat-card"><span>Steps today</span><strong>{latestDailyMetric?.steps || 0}</strong></div>
            <div className="stat-card"><span>Water intake</span><strong>{latestDailyMetric?.water_intake_ml || latestWellness?.water_intake_ml || 0} ml</strong></div>
            <div className="stat-card"><span>Latest weight</span><strong>{latestBodyMetric?.weight_kg || '--'} kg</strong></div>
          </div>
          <div className="two-column-grid">
            <div className="card">
              <h3>Today&apos;s meals</h3>
              {todayMeals.length === 0 ? <p className="muted-text">No meals logged yet today.</p> : todayMeals.map((meal) => (
                <div key={meal.id} className="list-row">
                  <div>
                    <strong>{meal.meal_type}</strong>
                    <p className="muted-text">{meal.food_items || 'No details added'}</p>
                  </div>
                  {meal.date === today && <button className="btn btn-danger" onClick={() => nutritionAPI.deleteMeal(meal.id).then(loadData)}>Delete</button>}
                </div>
              ))}
            </div>
            <div className="card">
              <h3>Wellness snapshot</h3>
              {latestWellness ? (
                <div className="detail-grid">
                  <div><strong>Mood</strong><p>{latestWellness.mood}</p></div>
                  <div><strong>Energy</strong><p>{latestWellness.energy_level}/10</p></div>
                  <div><strong>Stress</strong><p>{latestWellness.stress_level}/10</p></div>
                  <div><strong>Sleep</strong><p>{latestWellness.sleep_hours || '--'}h</p></div>
                </div>
              ) : <p className="muted-text">No wellness data yet.</p>}
            </div>
          </div>
        </>
      )}

      {activeTab === 'meals' && (
        <div className="two-column-grid">
          <div className="card">
            <h3>Log a meal</h3>
            <form onSubmit={saveMeal}>
              <div className="form-group"><label>Date</label><input type="date" value={mealForm.date} onChange={(e) => setMealForm({ ...mealForm, date: e.target.value })} required /></div>
              <div className="form-group"><label>Meal Type</label><select value={mealForm.meal_type} onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></div>
              <div className="form-group"><label>Food Items</label><textarea rows="3" value={mealForm.food_items} onChange={(e) => setMealForm({ ...mealForm, food_items: e.target.value })} /></div>
              <div className="detail-grid">
                <div className="form-group"><label>Calories</label><input type="number" value={mealForm.calories} onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })} /></div>
                <div className="form-group"><label>Protein</label><input type="number" value={mealForm.protein_g} onChange={(e) => setMealForm({ ...mealForm, protein_g: e.target.value })} /></div>
                <div className="form-group"><label>Carbs</label><input type="number" value={mealForm.carbs_g} onChange={(e) => setMealForm({ ...mealForm, carbs_g: e.target.value })} /></div>
                <div className="form-group"><label>Fat</label><input type="number" value={mealForm.fat_g} onChange={(e) => setMealForm({ ...mealForm, fat_g: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn btn-primary">Save Meal</button>
            </form>
          </div>
          <div className="card">
            <h3>Meal history</h3>
            {meals.map((meal) => (
              <div key={meal.id} className="list-row">
                <div>
                  <strong>{meal.date} · {meal.meal_type}</strong>
                  <p className="muted-text">{meal.food_items || 'No notes added'}</p>
                </div>
                {meal.date === today && <button className="btn btn-danger" onClick={() => nutritionAPI.deleteMeal(meal.id).then(loadData)}>Delete</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="two-column-grid">
          <div className="card">
            <h3>Daily metrics</h3>
            <form onSubmit={saveDailyMetric}>
              <div className="form-group"><label>Date</label><input type="date" value={dailyMetricForm.date} onChange={(e) => setDailyMetricForm({ ...dailyMetricForm, date: e.target.value })} required /></div>
              <div className="detail-grid">
                <div className="form-group"><label>Steps</label><input type="number" value={dailyMetricForm.steps} onChange={(e) => setDailyMetricForm({ ...dailyMetricForm, steps: e.target.value })} /></div>
                <div className="form-group"><label>Calories Burned</label><input type="number" value={dailyMetricForm.calories_burned} onChange={(e) => setDailyMetricForm({ ...dailyMetricForm, calories_burned: e.target.value })} /></div>
                <div className="form-group"><label>Water Intake (ml)</label><input type="number" value={dailyMetricForm.water_intake_ml} onChange={(e) => setDailyMetricForm({ ...dailyMetricForm, water_intake_ml: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn btn-primary">Save Daily Metrics</button>
            </form>
          </div>
          <div className="card">
            <h3>Body metrics</h3>
            <form onSubmit={saveBodyMetric}>
              <div className="form-group"><label>Date</label><input type="date" value={bodyMetricForm.date} onChange={(e) => setBodyMetricForm({ ...bodyMetricForm, date: e.target.value })} required /></div>
              <div className="detail-grid">
                <div className="form-group"><label>Weight (kg)</label><input type="number" value={bodyMetricForm.weight_kg} onChange={(e) => setBodyMetricForm({ ...bodyMetricForm, weight_kg: e.target.value })} /></div>
                <div className="form-group"><label>Body Fat %</label><input type="number" value={bodyMetricForm.body_fat_percentage} onChange={(e) => setBodyMetricForm({ ...bodyMetricForm, body_fat_percentage: e.target.value })} /></div>
                <div className="form-group"><label>Waist (cm)</label><input type="number" value={bodyMetricForm.waist_cm} onChange={(e) => setBodyMetricForm({ ...bodyMetricForm, waist_cm: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn btn-primary">Save Body Metrics</button>
            </form>
          </div>
          <div className="card">
            <h3>Recent daily metrics</h3>
            {dailyMetrics.map((metric) => (
              <div key={metric.id} className="list-row">
                <div>
                  <strong>{metric.date}</strong>
                  <p className="muted-text">Steps {metric.steps || 0} · Water {metric.water_intake_ml || 0} ml</p>
                </div>
                {metric.date === today && <button className="btn btn-danger" onClick={() => nutritionAPI.deleteDailyMetric(metric.id).then(loadData)}>Delete</button>}
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Recent body metrics</h3>
            {bodyMetrics.map((metric) => (
              <div key={metric.id} className="list-row">
                <div>
                  <strong>{metric.date}</strong>
                  <p className="muted-text">Weight {metric.weight_kg || '--'} kg · Body Fat {metric.body_fat_percentage || '--'}%</p>
                </div>
                {metric.date === today && <button className="btn btn-danger" onClick={() => nutritionAPI.deleteMetric(metric.id).then(loadData)}>Delete</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'wellness' && (
        <div className="two-column-grid">
          <div className="card">
            <h3>Daily wellness check-in</h3>
            <form onSubmit={saveWellness}>
              <div className="form-group"><label>Date</label><input type="date" value={wellnessForm.date} onChange={(e) => setWellnessForm({ ...wellnessForm, date: e.target.value })} required /></div>
              <div className="detail-grid">
                <div className="form-group"><label>Mood</label><select value={wellnessForm.mood} onChange={(e) => setWellnessForm({ ...wellnessForm, mood: e.target.value })}><option value="excellent">Excellent</option><option value="good">Good</option><option value="okay">Okay</option><option value="poor">Poor</option><option value="terrible">Terrible</option></select></div>
                <div className="form-group"><label>Energy</label><input type="number" min="1" max="10" value={wellnessForm.energy_level} onChange={(e) => setWellnessForm({ ...wellnessForm, energy_level: e.target.value })} /></div>
                <div className="form-group"><label>Stress</label><input type="number" min="1" max="10" value={wellnessForm.stress_level} onChange={(e) => setWellnessForm({ ...wellnessForm, stress_level: e.target.value })} /></div>
                <div className="form-group"><label>Sleep Hours</label><input type="number" value={wellnessForm.sleep_hours} onChange={(e) => setWellnessForm({ ...wellnessForm, sleep_hours: e.target.value })} /></div>
                <div className="form-group"><label>Sleep Quality</label><select value={wellnessForm.sleep_quality} onChange={(e) => setWellnessForm({ ...wellnessForm, sleep_quality: e.target.value })}><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></div>
                <div className="form-group"><label>Water Intake</label><input type="number" value={wellnessForm.water_intake_ml} onChange={(e) => setWellnessForm({ ...wellnessForm, water_intake_ml: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn btn-primary">Save Wellness</button>
            </form>
          </div>
          <div className="card">
            <h3>Recent wellness logs</h3>
            {wellnessLogs.map((log) => (
              <div key={log.id} className="list-row">
                <div>
                  <strong>{log.date} · {log.mood}</strong>
                  <p className="muted-text">Energy {log.energy_level}/10 · Stress {log.stress_level}/10</p>
                </div>
                {log.date === today && <button className="btn btn-danger" onClick={() => nutritionAPI.deleteWellness(log.id).then(loadData)}>Delete</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'meal-plans' && (
        <div className="two-column-grid">
          <div className="card">
            <h3>Create meal plan</h3>
            <form onSubmit={saveMealPlan}>
              <div className="form-group"><label>Plan title</label><input value={mealPlanDraft.title} onChange={(e) => setMealPlanDraft({ ...mealPlanDraft, title: e.target.value })} /></div>
              <div className="form-group"><label>Notes</label><textarea rows="5" value={mealPlanDraft.notes} onChange={(e) => setMealPlanDraft({ ...mealPlanDraft, notes: e.target.value })} /></div>
              <button type="submit" className="btn btn-primary">Save Plan</button>
            </form>
          </div>
          <div className="card">
            <h3>Saved meal plans</h3>
            {mealPlans.map((plan) => (
              <div key={plan.id} className="stack-card">
                <strong>{plan.title}</strong>
                <p className="muted-text">{plan.notes || 'No notes added'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Nutrition;

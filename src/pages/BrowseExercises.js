import React, { useState, useEffect } from 'react';

const BrowseExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const [page, setPage] = useState(1);
  const perPage = 6;

  const [loading, setLoading] = useState(true);

  // ✅ MOCK DATA
  const mockExercises = [
    { id: 1, name: "Push-Up", muscle: "Chest", equipment: "Bodyweight", difficulty: "Beginner", description: "Basic upper body exercise" },
    { id: 2, name: "Squat", muscle: "Legs", equipment: "Bodyweight", difficulty: "Beginner", description: "Lower body strength movement" },
    { id: 3, name: "Deadlift", muscle: "Back", equipment: "Barbell", difficulty: "Intermediate", description: "Compound strength lift" },
    { id: 4, name: "Bench Press", muscle: "Chest", equipment: "Barbell", difficulty: "Intermediate", description: "Chest strength exercise" },
    { id: 5, name: "Pull-Up", muscle: "Back", equipment: "Bodyweight", difficulty: "Advanced", description: "Upper body pulling movement" },
    { id: 6, name: "Lunges", muscle: "Legs", equipment: "Dumbbell", difficulty: "Beginner", description: "Leg stability exercise" },
    { id: 7, name: "Shoulder Press", muscle: "Shoulders", equipment: "Dumbbell", difficulty: "Intermediate", description: "Shoulder strength builder" },
    { id: 8, name: "Plank", muscle: "Core", equipment: "Bodyweight", difficulty: "Beginner", description: "Core stability exercise" },
    { id: 9, name: "Bicep Curl", muscle: "Arms", equipment: "Dumbbell", difficulty: "Beginner", description: "Arm isolation exercise" }
  ];

  const muscleGroups = ["Chest", "Back", "Legs", "Shoulders", "Core", "Arms"];
  const equipmentOptions = ["Bodyweight", "Dumbbell", "Barbell"];
  const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, selectedMuscle, selectedEquipment, selectedDifficulty, page]);

  const loadExercises = () => {
    setLoading(true);
    setExercises(mockExercises);
    setFilteredExercises(mockExercises);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    if (search) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedMuscle) {
      filtered = filtered.filter(ex => ex.muscle === selectedMuscle);
    }

    if (selectedEquipment) {
      filtered = filtered.filter(ex => ex.equipment === selectedEquipment);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty);
    }

    setFilteredExercises(filtered);
    setPage(1);
  };

  // Pagination
  const startIndex = (page - 1) * perPage;
  const paginated = filteredExercises.slice(startIndex, startIndex + perPage);
  const totalPages = Math.ceil(filteredExercises.length / perPage);

  return (
    <div className="container page-shell">

      {/* HERO */}
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Exercise Library</p>
          <h1>Browse exercises</h1>
          <p className="page-copy">
            Explore exercises by muscle group, equipment, and difficulty.
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card fade-up fade-up-1" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={selectedMuscle} onChange={(e) => setSelectedMuscle(e.target.value)}>
            <option value="">All Muscles</option>
            {muscleGroups.map(m => <option key={m}>{m}</option>)}
          </select>

          <select value={selectedEquipment} onChange={(e) => setSelectedEquipment(e.target.value)}>
            <option value="">All Equipment</option>
            {equipmentOptions.map(e => <option key={e}>{e}</option>)}
          </select>

          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
            <option value="">All Difficulty</option>
            {difficultyOptions.map(d => <option key={d}>{d}</option>)}
          </select>

        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="loading">Loading exercises...</div>
      ) : filteredExercises.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>No exercises found</h3>
          <p className="muted-text">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="coach-grid fade-up fade-up-2">
            {paginated.map(ex => (
              <div key={ex.id} className="coach-card">
                <h3>{ex.name}</h3>

                <p className="muted-text">{ex.description}</p>

                <div className="coach-specs">
                  <span className="badge badge-teal">{ex.muscle}</span>
                  <span className="badge badge-muted">{ex.equipment}</span>
                  <span className="badge badge-purple">{ex.difficulty}</span>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-12">
              <button
                className="btn btn-ghost btn-sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>

              <span className="muted-text">
                Page {page} of {totalPages}
              </span>

              <button
                className="btn btn-ghost btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrowseExercises;
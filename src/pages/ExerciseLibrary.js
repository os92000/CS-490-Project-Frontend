import React, { useEffect, useState, useCallback } from 'react';
import { workoutsAPI } from '../services/api';

const DIFFICULTIES = ['', 'beginner', 'intermediate', 'advanced'];
const diffBadge = { beginner: 'badge-green', intermediate: 'badge-amber', advanced: 'badge-red' };

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '', muscle_group: '', difficulty: '', equipment: '' });
  const [categories, setCategories] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  const loadExercises = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.muscle_group) params.muscle_group = filters.muscle_group;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.equipment) params.equipment = filters.equipment;
      const res = await workoutsAPI.getExercises(params);
      if (res.data.success) {
        const exs = res.data.data.exercises || [];
        setExercises(exs);
        // Build filter options from data
        setCategories([...new Set(exs.map(e => e.category).filter(Boolean))].sort());
        setMuscleGroups([...new Set(exs.map(e => e.muscle_group).filter(Boolean))].sort());
        setEquipmentList([...new Set(exs.map(e => e.equipment).filter(Boolean))].sort());
      }
    } catch { }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ search: '', category: '', muscle_group: '', difficulty: '', equipment: '' });
  const activeFilters = Object.values(filters).filter(Boolean).length;

  // Group by category
  const byCategory = exercises.reduce((acc, ex) => {
    const cat = ex.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {});

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Training</p>
          <h1>Exercise Library</h1>
          <p className="page-copy">Browse all available exercises, filter by muscle group or equipment, and learn proper form and instructions.</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card fade-up fade-up-1" style={{ padding: '16px 20px' }}>
        <div className="flex gap-10 flex-wrap items-center">
          <input
            style={{ flex: '1 1 200px', maxWidth: 320 }}
            placeholder="Search exercises…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          <select style={{ flex: '1 1 140px', maxWidth: 200 }} value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={{ flex: '1 1 140px', maxWidth: 200 }} value={filters.muscle_group} onChange={e => setFilter('muscle_group', e.target.value)}>
            <option value="">All muscle groups</option>
            {muscleGroups.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select style={{ flex: '1 1 130px', maxWidth: 180 }} value={filters.difficulty} onChange={e => setFilter('difficulty', e.target.value)}>
            <option value="">All levels</option>
            {DIFFICULTIES.filter(Boolean).map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
          <select style={{ flex: '1 1 130px', maxWidth: 200 }} value={filters.equipment} onChange={e => setFilter('equipment', e.target.value)}>
            <option value="">All equipment</option>
            {equipmentList.map(eq => <option key={eq} value={eq}>{eq}</option>)}
          </select>
          {activeFilters > 0 && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear {activeFilters} filter{activeFilters !== 1 ? 's' : ''}</button>}
        </div>
      </div>

      <div className="two-col fade-up fade-up-2" style={{ gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        {/* EXERCISE LIST */}
        <div>
          {loading ? <div className="loading">Loading exercises…</div> : exercises.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
              <h3 style={{ marginBottom: 8 }}>No exercises found</h3>
              <p className="muted-text">Try adjusting your filters or clearing the search.</p>
            </div>
          ) : (
            <>
              <p className="muted-text" style={{ marginBottom: 14 }}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''} found</p>
              {Object.keys(byCategory).sort().map(cat => (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 12, color: 'var(--text-2)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat} ({byCategory[cat].length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {byCategory[cat].map(ex => (
                      <div key={ex.id}
                        onClick={() => setSelected(selected?.id === ex.id ? null : ex)}
                        className="card card-hover"
                        style={{ borderRadius: 12, cursor: 'pointer', borderColor: selected?.id === ex.id ? 'var(--green)' : 'var(--border)', background: selected?.id === ex.id ? 'rgba(63,185,80,0.06)' : 'var(--bg-2)' }}>
                        <div className="flex justify-between items-start gap-8 mb-8">
                          <h4 style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{ex.name}</h4>
                          {ex.difficulty && <span className={`badge ${diffBadge[ex.difficulty] || 'badge-muted'}`} style={{ fontSize: 10, flexShrink: 0 }}>{ex.difficulty}</span>}
                        </div>
                        <div className="flex flex-wrap gap-6">
                          {ex.muscle_group && <span className="badge badge-teal" style={{ fontSize: 10 }}>{ex.muscle_group}</span>}
                          {ex.equipment && <span className="badge badge-muted" style={{ fontSize: 10 }}>{ex.equipment}</span>}
                        </div>
                        {ex.description && <p className="muted-text" style={{ fontSize: 12, marginTop: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ex.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* EXERCISE DETAIL PANEL */}
        {selected && (
          <div className="card fade-up" style={{ borderColor: 'rgba(63,185,80,0.3)', position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
            <div className="flex justify-between items-start mb-16">
              <h2>{selected.name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="flex flex-wrap gap-8 mb-16">
              {selected.category && <span className="badge badge-green">{selected.category}</span>}
              {selected.difficulty && <span className={`badge ${diffBadge[selected.difficulty] || 'badge-muted'}`}>{selected.difficulty}</span>}
              {selected.muscle_group && <span className="badge badge-teal">{selected.muscle_group}</span>}
              {selected.equipment && <span className="badge badge-muted">{selected.equipment}</span>}
            </div>

            {selected.description && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: 'var(--text-2)', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>About</h4>
                <p className="muted-text" style={{ lineHeight: 1.7 }}>{selected.description}</p>
              </div>
            )}

            {selected.instructions && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: 'var(--text-2)', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Instructions</h4>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  {selected.instructions.split('\n').filter(Boolean).map((step, i) => (
                    <div key={i} className="flex gap-12" style={{ marginBottom: i < selected.instructions.split('\n').filter(Boolean).length - 1 ? 10 : 0 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--green-dim)', border: '1px solid rgba(63,185,80,0.3)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>{i + 1}</span>
                      <p className="muted-text" style={{ fontSize: 13, lineHeight: 1.6 }}>{step.replace(/^\d+\.\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.video_url && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: 'var(--text-2)', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Video</h4>
                <a href={selected.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">▶ Watch video tutorial</a>
              </div>
            )}

            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' }}>
              {selected.is_public ? '🌐 Public exercise' : '🔒 Admin-approved exercise'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLibrary;

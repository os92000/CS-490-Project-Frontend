import React, { useEffect, useState, useRef } from 'react';
import { progressPhotosAPI } from '../services/api';

const categories = ['front', 'back', 'side', 'other'];
const categoryLabels = { front: 'Front', back: 'Back', side: 'Side', other: 'Other' };

const ProgressPhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [uploadForm, setUploadForm] = useState({ category: 'front', notes: '', date: new Date().toISOString().split('T')[0] });
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { loadPhotos(); }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const res = await progressPhotosAPI.getPhotos();
      if (res.data.success) setPhotos(res.data.data.photos || []);
    } catch { setError('Failed to load photos.'); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return; }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Please select a photo.'); return; }
    setUploading(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('category', uploadForm.category);
      fd.append('notes', uploadForm.notes);
      fd.append('date', uploadForm.date);
      await progressPhotosAPI.uploadPhoto(fd);
      setSuccess('Photo uploaded!');
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = '';
      setUploadForm({ category: 'front', notes: '', date: new Date().toISOString().split('T')[0] });
      loadPhotos();
    } catch (err) { setError(err.response?.data?.message || 'Failed to upload photo.'); }
    finally { setUploading(false); }
  };

  const deletePhoto = async (id) => {
    if (!window.confirm('Delete this photo?')) return;
    try { await progressPhotosAPI.deletePhoto(id); setSuccess('Deleted.'); loadPhotos(); }
    catch { setError('Failed to delete.'); }
  };

  const filtered = filterCat === 'all' ? photos : photos.filter(p => p.category === filterCat);

  const selectCompare = (photo) => {
    if (!compareA) { setCompareA(photo); return; }
    if (compareA.id === photo.id) { setCompareA(null); return; }
    setCompareB(photo);
  };

  // Group photos by date for before/after view
  const byDate = filtered.reduce((acc, p) => {
    const d = p.date || p.uploaded_at?.split('T')[0] || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort().reverse();

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="flex justify-between items-center flex-wrap gap-16">
          <div className="hero-copy">
            <p className="eyebrow">Progress Tracking</p>
            <h1>Progress Photos</h1>
            <p className="page-copy">Track your physical transformation with before/after photos. Compare any two dates side by side.</p>
          </div>
          <div className="flex gap-10">
            <button className={`btn ${compareMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setCompareMode(!compareMode); setCompareA(null); setCompareB(null); }}>
              {compareMode ? '✕ Exit compare' : '⇄ Compare mode'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* COMPARE MODE */}
      {compareMode && (
        <div className="card fade-up" style={{ borderColor: 'rgba(88,166,255,0.3)', background: 'rgba(88,166,255,0.04)' }}>
          <h2 style={{ marginBottom: 8 }}>Compare photos</h2>
          <p className="muted-text" style={{ marginBottom: 16 }}>
            {!compareA ? 'Click any photo below to select it as "Before"' : !compareB ? 'Now click another photo to set "After"' : 'Viewing comparison below'}
          </p>
          {compareA && compareB && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
              {[{ label: 'BEFORE', photo: compareA }, { label: 'AFTER', photo: compareB }].map(({ label, photo }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: 8, padding: '6px 12px', marginBottom: 10, display: 'inline-block', fontSize: 12, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>{label}</div>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid var(--border-2)' }}>
                    {photo.photo_url ? (
                      <img src={photo.photo_url} alt={label} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ aspectRatio: '3/4', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 48 }}>📷</div>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>{photo.date} · {categoryLabels[photo.category] || photo.category}</p>
                  {photo.notes && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{photo.notes}</p>}
                </div>
              ))}
            </div>
          )}
          {compareA && !compareB && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 60, height: 80, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--green)', flexShrink: 0 }}>
                {compareA.photo_url ? <img src={compareA.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>📷</div>}
              </div>
              <div>
                <strong style={{ fontSize: 13 }}>Selected: {compareA.date}</strong>
                <p className="muted-text" style={{ fontSize: 12 }}>Now click another photo to compare</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setCompareA(null)}>Clear</button>
            </div>
          )}
        </div>
      )}

      <div className="two-col fade-up fade-up-1">
        {/* UPLOAD FORM */}
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>Upload a photo</h2>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* File drop zone */}
            <div
              style={{ border: '2px dashed var(--border-2)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', background: 'var(--surface)' }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--green)'; }}
              onDragLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-2)'; if (fileRef.current && e.dataTransfer.files[0]) { const dt = new DataTransfer(); dt.items.add(e.dataTransfer.files[0]); fileRef.current.files = dt.files; handleFileChange({ target: fileRef.current }); } }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{ maxHeight: 200, borderRadius: 8, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
              ) : (
                <>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📷</p>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>Click or drag a photo here</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>JPG, PNG, WEBP · max 10MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>

            <div className="form-group">
              <label>Category</label>
              <div className="flex gap-8 mt-8">
                {categories.map(c => (
                  <button key={c} type="button"
                    className={`badge-option ${uploadForm.category === c ? 'selected' : ''}`}
                    onClick={() => setUploadForm(f => ({ ...f, category: c }))}>
                    {categoryLabels[c]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input type="date" value={uploadForm.date} onChange={e => setUploadForm(f => ({ ...f, date: e.target.value }))} />
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <input value={uploadForm.notes} onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Week 4 check-in, 2kg down" />
            </div>

            <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload photo'}</button>
          </form>
        </div>

        {/* LEGEND + STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Photo library</h3>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div className="stat-card"><span className="stat-label">Total photos</span><span className="stat-value" style={{ fontSize: 20 }}>{photos.length}</span></div>
              <div className="stat-card"><span className="stat-label">Check-in dates</span><span className="stat-value" style={{ fontSize: 20 }}>{sortedDates.length}</span></div>
              {categories.map(c => (
                <div key={c} className="stat-card">
                  <span className="stat-label">{categoryLabels[c]}</span>
                  <span className="stat-value" style={{ fontSize: 20 }}>{photos.filter(p => p.category === c).length}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>How to use</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['📸', 'Upload front, back, and side photos regularly (e.g. every 2–4 weeks)'],
                ['⇄', 'Use Compare Mode to put any two photos side by side'],
                ['📅', 'Photos are grouped by date so you can see each check-in'],
                ['🔒', 'Only you and your coach can see your progress photos'],
              ].map(([icon, tip]) => (
                <div key={tip} className="flex items-center gap-12">
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <p className="muted-text" style={{ fontSize: 13 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PHOTO GALLERY */}
      <div className="card fade-up fade-up-2">
        <div className="section-header">
          <div><h2>Your photos</h2><p className="muted-text">{filtered.length} photos</p></div>
          <div className="tab-row">
            {['all', ...categories].map(c => (
              <button key={c} className={`tab-button ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>
                {c === 'all' ? 'All' : categoryLabels[c]}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="loading">Loading photos…</div> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📷</p>
            <h3 style={{ marginBottom: 8 }}>No photos yet</h3>
            <p className="muted-text">Upload your first progress photo above to start tracking your transformation.</p>
          </div>
        ) : (
          <div>
            {sortedDates.map(date => (
              <div key={date} style={{ marginBottom: 32 }}>
                <div className="flex items-center gap-12" style={{ marginBottom: 14 }}>
                  <strong style={{ fontSize: 15 }}>{date}</strong>
                  <span className="badge badge-muted">{byDate[date].length} photo{byDate[date].length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {byDate[date].filter(p => filterCat === 'all' || p.category === filterCat).map(photo => (
                    <div key={photo.id} style={{ position: 'relative', cursor: compareMode ? 'pointer' : 'default', borderRadius: 12, overflow: 'hidden', border: `2px solid ${compareA?.id === photo.id || compareB?.id === photo.id ? 'var(--green)' : 'var(--border)'}`, transition: 'all 0.15s' }}
                      onClick={() => compareMode && selectCompare(photo)}>
                      {photo.photo_url ? (
                        <img src={photo.photo_url} alt={photo.category} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ aspectRatio: '3/4', background: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 36 }}>📷</div>
                      )}
                      <div style={{ padding: '8px 10px', background: 'var(--bg-3)', borderTop: '1px solid var(--border)' }}>
                        <span className="badge badge-muted" style={{ fontSize: 10 }}>{categoryLabels[photo.category] || photo.category}</span>
                        {photo.notes && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{photo.notes}</p>}
                      </div>
                      {!compareMode && (
                        <button onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                          style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(248,81,73,0.85)', border: 'none', borderRadius: 6, color: '#fff', width: 24, height: 24, cursor: 'pointer', fontSize: 12, display: 'grid', placeItems: 'center' }}>✕</button>
                      )}
                      {compareMode && (compareA?.id === photo.id || compareB?.id === photo.id) && (
                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'var(--green)', borderRadius: 6, color: '#000', padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          {compareA?.id === photo.id ? 'BEFORE' : 'AFTER'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPhotos;

import React, { useCallback, useEffect, useState } from 'react';
import { paymentsAPI, coachesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Payments = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [myCoach, setMyCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [payForm, setPayForm] = useState({ coach_id: '', pricing_id: '', payment_method: 'card', card_number: '', card_expiry: '', card_cvv: '' });
  const [pricing, setPricing] = useState([]);
  const [paying, setPaying] = useState(false);

  const isCoach = user?.role === 'coach' || user?.role === 'both';
  const isClient = user?.role === 'client' || user?.role === 'both';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [histRes, coachRes] = await Promise.all([
        paymentsAPI.getPaymentHistory().catch(() => null),
        isClient ? coachesAPI.getMyCoach().catch(() => null) : Promise.resolve(null),
      ]);
      if (histRes?.data?.success) setHistory(histRes.data.data.payments || []);
      if (coachRes?.data?.success) {
        setMyCoach(coachRes.data.data);
        if (coachRes.data.data?.id) {
          const priceRes = await paymentsAPI.getCoachPricing(coachRes.data.data.id).catch(() => null);
          if (priceRes?.data?.success) setPricing(priceRes.data.data.pricing || []);
        }
      }
    } catch { setError('Failed to load payment data.'); }
    finally { setLoading(false); }
  }, [isClient]);

  useEffect(() => { loadData(); }, [loadData]);

  const processPayment = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setPaying(true);
    try {
      const res = await paymentsAPI.processPayment({
        coach_id: payForm.coach_id || myCoach?.id,
        pricing_id: payForm.pricing_id,
        payment_method: payForm.payment_method,
      });
      if (res.data.success) {
        setSuccess('Payment processed successfully!');
        setPayForm(f => ({ ...f, pricing_id: '', card_number: '', card_expiry: '', card_cvv: '' }));
        loadData();
        setActiveTab('history');
      }
    } catch (err) { setError(err.response?.data?.message || 'Payment failed. Please try again.'); }
    finally { setPaying(false); }
  };

  const totalPaid = history.filter(p => p.direction === 'outgoing' || !isCoach).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalReceived = history.filter(p => p.direction === 'incoming' || isCoach).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const pending = history.filter(p => p.status === 'pending');

  const statusBadge = { completed: 'badge-green', pending: 'badge-amber', failed: 'badge-red', refunded: 'badge-blue' };

  if (loading) return <div className="loading">Loading payments…</div>;

  const tabs = isCoach
    ? [['overview','Overview'],['earnings','Earnings'],['history','History']]
    : [['overview','Overview'],['pay','Make Payment'],['history','History']];

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Payments</p>
          <h1>Payments & Billing</h1>
          <p className="page-copy">
            {isCoach ? 'Track your earnings, manage payment history, and view outstanding invoices.' : 'Pay your coach, view billing history, and manage your payment methods.'}
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* STAT CARDS */}
      <div className="stats-grid fade-up fade-up-1">
        {(isCoach ? [
          { label: 'Total earned', value: `$${totalReceived.toFixed(2)}`, sub: 'all time', color: 'var(--green)' },
          { label: 'This month', value: `$${history.filter(p => p.paid_at?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,p)=>s+parseFloat(p.amount||0),0).toFixed(2)}`, sub: 'revenue', color: 'var(--teal)' },
          { label: 'Pending', value: pending.length, sub: 'awaiting payment', color: 'var(--amber)' },
          { label: 'Clients', value: [...new Set(history.map(p => p.client_id))].length, sub: 'active payers', color: 'var(--blue)' },
        ] : [
          { label: 'Total paid', value: `$${totalPaid.toFixed(2)}`, sub: 'all time', color: 'var(--text)' },
          { label: 'This month', value: `$${history.filter(p => p.paid_at?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,p)=>s+parseFloat(p.amount||0),0).toFixed(2)}`, sub: 'spent', color: 'var(--amber)' },
          { label: 'Pending', value: pending.length, sub: 'awaiting', color: pending.length > 0 ? 'var(--red)' : 'var(--text-2)' },
          { label: 'Payments', value: history.length, sub: 'total transactions', color: 'var(--blue)' },
        ]).map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color, fontSize: 20 }}>{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="tab-row fade-up fade-up-2">
        {tabs.map(([v, l]) => <button key={v} className={`tab-button ${activeTab === v ? 'active' : ''}`} onClick={() => setActiveTab(v)}>{l}</button>)}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="two-col fade-up">
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>
              {isCoach ? 'Your coaching rates' : myCoach ? `${myCoach.profile?.first_name || 'Coach'}'s rates` : 'Pricing'}
            </h2>
            {pricing.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>💳</p>
                <p className="muted-text">{isCoach ? 'Set your rates in Coach Settings.' : myCoach ? 'No pricing set by your coach yet.' : 'Connect with a coach first.'}</p>
              </div>
            ) : pricing.map(p => (
              <div key={p.id} className="list-row">
                <div>
                  <strong style={{ fontSize: 15 }}>{p.session_type || 'Session'}</strong>
                  <p className="muted-text" style={{ fontSize: 12 }}>{p.currency || 'USD'}</p>
                </div>
                <div className="flex items-center gap-12">
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', fontFamily: "'Syne', sans-serif" }}>${p.price}</span>
                  {isClient && !isCoach && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setPayForm(f => ({ ...f, pricing_id: p.id })); setActiveTab('pay'); }}>Pay now</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>Recent activity</h2>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
                <p className="muted-text">No payment history yet.</p>
              </div>
            ) : history.slice(0, 5).map(p => (
              <div key={p.id} className="list-row">
                <div>
                  <strong style={{ fontSize: 13 }}>{p.payment_reference || `Payment #${p.id}`}</strong>
                  <p className="muted-text" style={{ fontSize: 12 }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'Pending'} · {p.session_type || 'Session'}</p>
                </div>
                <div className="flex items-center gap-8">
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', fontFamily: "'Syne', sans-serif" }}>${p.amount}</span>
                  <span className={`badge ${statusBadge[p.status] || 'badge-muted'}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAKE PAYMENT (clients) */}
      {activeTab === 'pay' && !isCoach && (
        <div className="two-col fade-up">
          <div className="card">
            <h2 style={{ marginBottom: 18 }}>Make a payment</h2>
            {!myCoach ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>👤</p>
                <h3 style={{ marginBottom: 8 }}>No active coach</h3>
                <p className="muted-text">You need an active coaching relationship before making a payment.</p>
              </div>
            ) : (
              <form onSubmit={processPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--green), var(--teal))', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                    {(myCoach.profile?.first_name?.[0] || 'C').toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: 14 }}>{myCoach.profile?.first_name} {myCoach.profile?.last_name}</strong>
                    <p className="muted-text" style={{ fontSize: 12 }}>Your coach</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Select session type *</label>
                  <select value={payForm.pricing_id} onChange={e => setPayForm(f => ({ ...f, pricing_id: e.target.value }))} required>
                    <option value="">Choose a session type</option>
                    {pricing.map(p => <option key={p.id} value={p.id}>{p.session_type} — ${p.price}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment method</label>
                  <div className="flex gap-10 mt-8">
                    {[['card', '💳 Card'], ['paypal', '🅿️ PayPal'], ['bank', '🏦 Bank transfer']].map(([v, l]) => (
                      <button key={v} type="button" className={`badge-option ${payForm.payment_method === v ? 'selected' : ''}`} onClick={() => setPayForm(f => ({ ...f, payment_method: v }))}>{l}</button>
                    ))}
                  </div>
                </div>

                {payForm.payment_method === 'card' && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                    <div className="form-group">
                      <label>Card number</label>
                      <input value={payForm.card_number} onChange={e => setPayForm(f => ({ ...f, card_number: e.target.value }))} placeholder="1234 5678 9012 3456" maxLength={19} />
                    </div>
                    <div className="flex gap-12">
                      <div className="form-group w-full"><label>Expiry</label><input value={payForm.card_expiry} onChange={e => setPayForm(f => ({ ...f, card_expiry: e.target.value }))} placeholder="MM / YY" maxLength={7} /></div>
                      <div className="form-group w-full"><label>CVV</label><input value={payForm.card_cvv} onChange={e => setPayForm(f => ({ ...f, card_cvv: e.target.value }))} placeholder="123" maxLength={4} type="password" /></div>
                    </div>
                  </div>
                )}

                {payForm.pricing_id && (
                  <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: 12, padding: 14 }}>
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{pricing.find(p => p.id.toString() === payForm.pricing_id.toString())?.session_type}</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', fontFamily: "'Syne', sans-serif" }}>
                        ${pricing.find(p => p.id.toString() === payForm.pricing_id.toString())?.price}
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" disabled={paying || !payForm.pricing_id}>
                  {paying ? 'Processing…' : 'Confirm payment'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>🔒 Payments are securely processed. Your card details are never stored.</p>
              </form>
            )}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 16 }}>Payment summary</h2>
            {[
              { label: 'Total paid this year', value: `$${history.reduce((s,p)=>s+parseFloat(p.amount||0),0).toFixed(2)}` },
              { label: 'Last payment', value: history[0] ? `$${history[0].amount} on ${new Date(history[0].paid_at).toLocaleDateString()}` : 'None' },
              { label: 'Pending payments', value: pending.length },
            ].map(s => (
              <div key={s.label} className="list-row">
                <span className="muted-text">{s.label}</span>
                <strong style={{ fontSize: 14 }}>{s.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EARNINGS (coaches) */}
      {activeTab === 'earnings' && isCoach && (
        <div className="card fade-up">
          <h2 style={{ marginBottom: 16 }}>Earnings breakdown</h2>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {['January','February','March','April'].map(m => (
              <div key={m} className="stat-card">
                <span className="stat-label">{m}</span>
                <span className="stat-value" style={{ fontSize: 18, color: 'var(--green)' }}>
                  ${history.filter(p => p.paid_at?.includes(m.slice(0,3))).reduce((s,p)=>s+parseFloat(p.amount||0),0).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <p className="muted-text">Earnings per session type:</p>
          {pricing.map(p => (
            <div key={p.id} className="list-row">
              <div>
                <strong style={{ fontSize: 14 }}>{p.session_type}</strong>
                <p className="muted-text" style={{ fontSize: 12 }}>{history.filter(h => h.session_type === p.session_type).length} payments received</p>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontFamily: "'Syne', sans-serif" }}>${p.price}/session</span>
            </div>
          ))}
        </div>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Payment history</h2><p className="muted-text">{history.length} transactions</p></div></div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>💳</p>
              <p className="muted-text">No payment history yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Reference</th><th>Session type</th><th>{isCoach ? 'Client' : 'Coach'}</th><th>Amount</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {history.map(p => (
                    <tr key={p.id}>
                      <td><code style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.payment_reference || `#${p.id}`}</code></td>
                      <td>{p.session_type || '—'}</td>
                      <td>{isCoach ? p.client?.profile?.first_name || p.client?.email || '—' : p.coach?.profile?.first_name || p.coach?.email || '—'}</td>
                      <td><strong style={{ color: 'var(--green)', fontFamily: "'Syne', sans-serif" }}>${p.amount}</strong></td>
                      <td style={{ fontSize: 12 }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                      <td><span className={`badge ${statusBadge[p.status] || 'badge-muted'}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payments;

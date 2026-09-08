import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';

const SAMPLE_EMAILS = [
  {
    label: '✨ Multi-Product Order (High Volume)',
    subject: 'Request for Quotation - Preservatives & Stabilizers Batch 2026',
    sender_email: 'rakesh@sharmapharma.com',
    body: `Dear Sales Team,

Kindly share your best CIF quote for the following bulk requirement:
- Sodium Benzoate: 500 kg
- Citric Acid Anhydrous: 2 MT (2000 kg)
- Potassium Sorbate: 100 kg
- Xanthan Gum: 50 kg

Please include standard lead times and COA availability.

Regards,
Rakesh Sharma
Sharma Pharma Pvt Ltd`,
  },
  {
    label: '🧪 CAS Number Specific RFQ',
    subject: 'Urgent Pricing Requirement - Ascorbic Acid (CAS 50-81-7)',
    sender_email: 'anita@vermachem.com',
    body: `Hi Team,

We require an immediate commercial quote for Ascorbic Acid (CAS 50-81-7), quantity 75 kg, for our pharmaceutical production line. 

Please send pricing, delivery ETA to Mumbai warehouse, and shelf-life certification.

Best regards,
Anita Verma
Verma Chemicals`,
  },
  {
    label: '💬 Non-RFQ Meeting Follow-up',
    subject: 'ChemExpo Networking Follow-up',
    sender_email: 'purchase@globalingredients.com',
    body: `Hi team, thanks for meeting with us yesterday at ChemExpo stall 4B. Great connecting with you. Let's schedule a call next quarter.

Best regards,
Global Ingredients Co`,
  },
];

export default function RFQs() {
  const [rfqs, setRfqs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    subject: '',
    sender_email: '',
    body: '',
    customer_id: '',
    source_channel: 'email',
  });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    const [rfqRes, custRes] = await Promise.all([
      api.get('/rfqs'),
      api.get('/customers'),
    ]);
    setRfqs(rfqRes.data.rfqs);
    setCustomers(custRes.data.customers);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fillSample = (sample) => {
    setForm({
      ...form,
      subject: sample.subject,
      sender_email: sample.sender_email,
      body: sample.body,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.customer_id) delete payload.customer_id;
      else payload.customer_id = Number(payload.customer_id);

      const { data } = await api.post('/rfqs/simulate-intake', payload);
      navigate(`/rfqs/${data.rfq.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process RFQ');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRfqs = rfqs.filter((r) => {
    const matchesSearch =
      (r.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.sender_email || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="spinner-wrap">
          <div className="spinner" />
          <span className="spinner-label">Loading RFQ inbox…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Inbound RFQ Inbox</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Multi-channel intake stream. Extracts items, identifies CAS numbers, queries live stock, and prepares quotes.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showForm ? 'Close Intake Form' : 'Simulate Inbound Email / RFQ'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>Simulate Inbound RFQ Message</h2>
            <span className="badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              Extraction Engine Ready
            </span>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', padding: 12, borderRadius: 8, marginBottom: 14, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div className="sample-buttons">
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              ⚡ 1-Click Demo Presets:
            </strong>
            {SAMPLE_EMAILS.map((s) => (
              <button
                type="button"
                key={s.label}
                className="btn-secondary"
                onClick={() => fillSample(s)}
                style={{ fontSize: '0.82rem' }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="form-grid">
            <div>
              <label>Intake Channel</label>
              <select name="source_channel" value={form.source_channel} onChange={handleChange}>
                <option value="email">Email (Outlook / Gmail)</option>
                <option value="manual">Manual Sales Intake</option>
                <option value="whatsapp">WhatsApp Business API</option>
                <option value="web_form">Customer Portal Form</option>
              </select>
            </div>

            <div>
              <label>Link to Customer Account (Optional)</label>
              <select name="customer_id" value={form.customer_id} onChange={handleChange}>
                <option value="">Auto-detect sender email or link later</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Subject Line</label>
              <input
                name="subject"
                placeholder="e.g. Quotation required for Sodium Benzoate"
                value={form.subject}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Sender Email Address</label>
              <input
                name="sender_email"
                type="email"
                placeholder="e.g. rakesh@sharmapharma.com"
                value={form.sender_email}
                onChange={handleChange}
              />
            </div>

            <div className="full-width">
              <label>Email Body / RFQ Text Content *</label>
              <textarea
                name="body"
                rows={7}
                value={form.body}
                onChange={handleChange}
                required
                placeholder="Paste incoming email or message here..."
              />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Running AI Extraction & Matching…' : 'Process RFQ & Auto-Match Catalog'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>All Inbound RFQs</h2>
            <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>
              {filteredRfqs.length} records
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="search-filter-bar">
          <div className="search-input-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search RFQs by subject, sender, or account…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'extracted', 'pending_approval', 'not_rfq'].map((st) => (
              <button
                key={st}
                type="button"
                className={statusFilter === st ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Subject &amp; Message</th>
                <th>Customer Account</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRfqs.map((r) => {
                const confPercent = Math.round((r.confidence_score || 0) * 100);
                const confColor = confPercent >= 70 ? '#10b981' : confPercent >= 40 ? '#f59e0b' : '#ef4444';

                return (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/rfqs/${r.id}`} className="table-tag-id">
                        #RFQ-{r.id}
                      </Link>
                    </td>
                    <td>
                      <strong>{r.subject || <span className="muted">(No subject)</span>}</strong>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        {r.sender_email || 'No email specified'}
                      </div>
                    </td>
                    <td>
                      {r.customer ? (
                        <div>
                          <strong>{r.customer.name}</strong>
                          <div className="muted" style={{ fontSize: '0.78rem' }}>{r.customer.company}</div>
                        </div>
                      ) : (
                        <span className="status-chip" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
                          <span className="chip-dot" style={{ background: '#f59e0b' }} />
                          Unlinked Customer
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {r.source_channel || 'Email'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge value={r.status} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: confColor }}>
                        {r.confidence_score != null ? `${confPercent}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/rfqs/${r.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        Open Workspace →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredRfqs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                    No RFQs found. Click "+ Simulate Inbound Email" to generate one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

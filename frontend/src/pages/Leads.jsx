import { useEffect, useState } from 'react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';

const SOURCES = ['event', 'meeting', 'campaign', 'inbound_email', 'inbound_whatsapp', 'website_form', 'outbound_cold'];
const CATEGORIES = ['Products', 'Vendors', 'Transporters', 'Brochures', 'COA Requests', 'Other'];
const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const EMPTY = { customer_id: '', source: 'website_form', category: 'Products', status: 'new', notes: '' };

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = async () => {
    const [leadsRes, customersRes] = await Promise.all([api.get('/leads'), api.get('/customers')]);
    setLeads(leadsRes.data.leads);
    setCustomers(customersRes.data.customers);
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/leads', { ...form, customer_id: Number(form.customer_id) });
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lead');
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/leads/${id}`, { status });
    load();
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      (l.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.customer?.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && l.status === statusFilter;
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Leads &amp; Enquiries CRM</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Multi-channel inbound lead consolidation from expos, campaigns, forms, and WhatsApp contacts.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showForm ? 'Cancel' : '+ New Lead'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>Record Inbound CRM Lead</h2>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="form-grid">
            <div>
              <label>Customer Account *</label>
              <select name="customer_id" value={form.customer_id} onChange={handleChange} required>
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Lead Source *</label>
              <select name="source" value={form.source} onChange={handleChange}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Category Interest</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Initial Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="full-width">
              <label>Interaction Notes &amp; Requirement Details</label>
              <textarea rows={3} name="notes" placeholder="e.g. Met at ChemExpo stall, interested in bulk citric acid supply." value={form.notes} onChange={handleChange} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn-primary" type="submit">Save Lead Record</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>Active Leads</h2>
            <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>
              {filteredLeads.length} leads
            </span>
          </div>
        </div>

        <div className="search-filter-bar">
          <div className="search-input-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search leads by customer, company, or notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', ...STATUSES].map((st) => (
              <button
                key={st}
                type="button"
                className={statusFilter === st ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Customer &amp; Company</th>
                <th>Channel Source</th>
                <th>Requirement Category</th>
                <th>Stage Status</th>
                <th>Assigned Sales Rep</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((l) => (
                <tr key={l.id}>
                  <td>
                    <span className="table-tag-id">#LEAD-{l.id}</span>
                  </td>
                  <td>
                    <strong>{l.customer?.name}</strong>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{l.customer?.company}</div>
                    {l.notes && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{l.notes}</div>}
                  </td>
                  <td>
                    <span className="status-chip" style={{ background: '#f1f5f9', color: '#475569' }}>
                      {l.source.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{l.category || '—'}</td>
                  <td>
                    <select
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.82rem', width: 130 }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{l.assignee?.name || 'Unassigned'}</span>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No leads match your criteria.
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

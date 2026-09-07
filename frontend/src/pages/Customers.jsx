import { useEffect, useState } from 'react';
import api from '../api';

const EMPTY = { name: '', company: '', email: '', phone: '', address: '', territory: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    const { data } = await api.get('/customers');
    setCustomers(data.customers);
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/customers', form);
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create customer');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Customer Accounts</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Verified accounts, trade contacts, company profiles, and territory mappings.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showForm ? 'Cancel' : '+ New Customer'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>Add New Customer Record</h2>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="form-grid">
            <div><label>Contact Name *</label><input name="name" placeholder="e.g. Ramesh Patel" value={form.name} onChange={handleChange} required /></div>
            <div><label>Company / Organization</label><input name="company" placeholder="e.g. Acme Pharma Ltd" value={form.company} onChange={handleChange} /></div>
            <div><label>Business Email *</label><input name="email" type="email" placeholder="contact@acme.com" value={form.email} onChange={handleChange} required /></div>
            <div><label>Phone Number</label><input name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} /></div>
            <div><label>Territory</label><input name="territory" placeholder="e.g. West, North, Pan-India" value={form.territory} onChange={handleChange} /></div>
            <div className="full-width"><label>Billing &amp; Delivery Address</label><textarea rows={3} name="address" placeholder="Factory / Registered office address" value={form.address} onChange={handleChange} /></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn-primary" type="submit">Save Customer Account</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>All Customers</h2>
            <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>
              {filteredCustomers.length} registered
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
              placeholder="Search by contact name, company, or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Customer Contact</th>
                <th>Company Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Territory</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const initials = c.name
                  ? c.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                  : 'C';
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar-circle" style={{ width: 28, height: 28, fontSize: '0.72rem' }}>
                          {initials}
                        </div>
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td>{c.company || '—'}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <span className="status-chip" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {c.territory || 'Unassigned'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No customer accounts found.
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

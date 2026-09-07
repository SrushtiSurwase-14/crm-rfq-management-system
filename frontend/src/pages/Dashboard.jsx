import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRfqs, setRecentRfqs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [customers, leads, products, rfqs, quotes] = await Promise.all([
          api.get('/customers'),
          api.get('/leads'),
          api.get('/products'),
          api.get('/rfqs'),
          api.get('/quotes'),
        ]);

        const lowStock = products.data.products.filter(
          (p) => p.inventory && p.inventory.quantity_available <= p.inventory.reorder_level
        );

        setStats({
          customers: customers.data.customers.length,
          leads: leads.data.leads.length,
          products: products.data.products.length,
          rfqs: rfqs.data.rfqs.length,
          pendingQuotes: quotes.data.quotes.filter((q) => q.status === 'pending_approval').length,
          totalQuotes: quotes.data.quotes.length,
          lowStock: lowStock.length,
        });

        setRecentRfqs(rfqs.data.rfqs.slice(0, 8));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <p className="error">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Loading live dashboard metrics…
          </div>
        </div>
      </div>
    );
  }

  const filteredRfqs = recentRfqs.filter((r) => {
    const matchesSearch =
      (r.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.sender_email || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  return (
    <div className="container">
      {/* Hero Welcome Banner */}
      <div className="dashboard-hero-card">
        <div className="hero-left">
          <h1>Welcome back, {user?.name || 'Team'}</h1>
          <p>
            Autonomous Lead-to-Quote Automation Suite: Intake emails, classify intent, extract chemical &amp; product line items, match catalog inventory, and generate review-ready quotes in seconds.
          </p>
        </div>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate('/rfqs')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Simulate Inbound RFQ
          </button>
          <button className="btn-secondary" onClick={() => navigate('/quotes')}>
            Review Quotes ({stats.pendingQuotes})
          </button>
        </div>
      </div>

      {/* Pipeline Stage Visualizer */}
      <div className="pipeline-flow-wrap">
        <div className="pipeline-flow-title">
          <span>Enterprise Sales Funnel Health</span>
          <span style={{ color: 'var(--primary)' }}>Live Process Progression</span>
        </div>
        <div className="pipeline-steps-grid">
          <div className="pipeline-step">
            <div className="step-num-icon">01</div>
            <div className="step-info">
              <span className="step-title">CRM Leads</span>
              <span className="step-count">{stats.leads}</span>
            </div>
          </div>

          <div className="pipeline-step">
            <div className="step-num-icon">02</div>
            <div className="step-info">
              <span className="step-title">Inbound RFQs</span>
              <span className="step-count">{stats.rfqs}</span>
            </div>
          </div>

          <div className="pipeline-step">
            <div className="step-num-icon">03</div>
            <div className="step-info">
              <span className="step-title">Active Customers</span>
              <span className="step-count">{stats.customers}</span>
            </div>
          </div>

          <div className="pipeline-step">
            <div className="step-num-icon">04</div>
            <div className="step-info">
              <span className="step-title">Total Quotes</span>
              <span className="step-count">{stats.totalQuotes}</span>
            </div>
          </div>

          <div className="pipeline-step" style={{ borderColor: stats.pendingQuotes > 0 ? '#fde68a' : 'var(--border)' }}>
            <div className="step-num-icon" style={{ background: stats.pendingQuotes > 0 ? '#fef3c7' : '#eef2ff', color: stats.pendingQuotes > 0 ? '#d97706' : 'var(--primary)' }}>
              05
            </div>
            <div className="step-info">
              <span className="step-title">Pending Review</span>
              <span className="step-count" style={{ color: stats.pendingQuotes > 0 ? '#d97706' : 'inherit' }}>
                {stats.pendingQuotes}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="stat-grid">
        <Link to="/customers" className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Active Customers</div>
            <div className="stat-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.customers}</div>
          <span className="stat-card-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
            Verified Accounts
          </span>
        </Link>

        <Link to="/leads" className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Leads</div>
            <div className="stat-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.leads}</div>
          <span className="stat-card-badge" style={{ background: '#faf5ff', color: '#7c3aed' }}>
            Multi-channel Pipeline
          </span>
        </Link>

        <Link to="/products" className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Catalog Products</div>
            <div className="stat-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.products}</div>
          <span className="stat-card-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
            Ready for Matching
          </span>
        </Link>

        <Link to="/rfqs" className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Inbound RFQs</div>
            <div className="stat-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.rfqs}</div>
          <span className="stat-card-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            Auto-Extracted
          </span>
        </Link>

        <Link
          to="/quotes"
          className={`stat-card ${stats.pendingQuotes > 0 ? 'stat-card-alert' : ''}`}
        >
          <div className="stat-card-top">
            <div className="stat-label">Quotes Awaiting Approval</div>
            <div className="stat-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.pendingQuotes}</div>
          <span
            className="stat-card-badge"
            style={{
              background: stats.pendingQuotes > 0 ? '#fef3c7' : '#f1f5f9',
              color: stats.pendingQuotes > 0 ? '#b45309' : 'var(--text-muted)',
            }}
          >
            {stats.pendingQuotes > 0 ? '⚠️ Action Needed' : 'All Clear'}
          </span>
        </Link>

        <Link
          to="/products"
          className={`stat-card ${stats.lowStock > 0 ? 'stat-card-danger' : ''}`}
        >
          <div className="stat-card-top">
            <div className="stat-label">Low / Out of Stock</div>
            <div className="stat-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.lowStock}</div>
          <span
            className="stat-card-badge"
            style={{
              background: stats.lowStock > 0 ? '#fee2e2' : '#ecfdf5',
              color: stats.lowStock > 0 ? '#dc2626' : '#059669',
            }}
          >
            {stats.lowStock > 0 ? 'Needs Replenishment' : 'Inventory Healthy'}
          </span>
        </Link>
      </div>

      {/* Recent RFQs Section with Live Filter */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>Recent Inbound RFQ Pipeline</h2>
            <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Showing latest {filteredRfqs.length} of {recentRfqs.length}
            </span>
          </div>
          <Link to="/rfqs" className="btn-secondary" style={{ padding: '6px 14px' }}>
            Open RFQ Inbox →
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-input-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by subject, customer, or sender email…"
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
                {st === 'ALL' ? 'All Statuses' : st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>RFQ Ref</th>
                <th>Subject</th>
                <th>Customer / Account</th>
                <th>Channel</th>
                <th>AI Classification</th>
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
                      <strong style={{ color: 'var(--text-main)' }}>
                        {r.subject || <span className="muted">(No subject provided)</span>}
                      </strong>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {r.sender_email || 'Direct intake'}
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
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.85rem' }}>
                        {r.source_channel || 'Email'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge value={r.status} />
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: confColor }}>
                          {r.confidence_score != null ? `${confPercent}%` : '—'}
                        </span>
                        {r.confidence_score != null && (
                          <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
                            <div style={{ width: `${confPercent}%`, height: '100%', background: confColor, borderRadius: 9999 }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Link to={`/rfqs/${r.id}`} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredRfqs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                    {searchQuery ? 'No RFQs match your search query.' : 'No RFQs recorded yet. Simulate an incoming RFQ to test.'}
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
